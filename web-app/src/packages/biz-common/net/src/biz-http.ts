// src/packages/biz-common/net/src/biz-http.ts
import { HttpManager, HttpClient, HttpClientConfig, RequestConfig } from '@ming/core-network'
import { BizCodeRange, ClientErrorCode, getBizCodeCategory } from './error-code'
import type {
  BizApiResponse,
  BizHttpClientConfig,
  BizRequestCallbacks,
  BizRequestConfig,
  BizResult,
  ErrDataResponse,
} from './types'
import { ERROR_MESSAGES, getHttpStatusMessage } from './error-messages'

const DEFAULT_TIMEOUT = 10000

export class BizHttp {
  private httpManager: HttpManager

  constructor(manager?: HttpManager) {
    this.httpManager = manager || new HttpManager()
  }

  /**
   * 外部快速初始化：配置 baseURL/timeout，并设为默认客户端
   */
  public init(config: BizHttpClientConfig): HttpClient {
    const { timeout = DEFAULT_TIMEOUT, axiosConfig, ...restConfig } = config

    // 组装并处理包含 timeout 的 Axios 配置
    const mergedConfig: HttpClientConfig = {
      ...restConfig,
      axiosConfig: {
        timeout,
        ...axiosConfig
      }
    }

    const client = this.httpManager.createClient(mergedConfig)
    this.httpManager.setDefaultClient(client)
    return client
  }

  /**
   * 获取底层 HttpClient 实例（在此添加全局 Request / Response 拦截器）
   */
  public getClient(): HttpClient {
    return this.httpManager.getDefaultClient()
  }

  /**
   * 规范化单次请求配置，处理单次 timeout 等逻辑
   */
  private normalizeConfig(cfg?: BizRequestConfig): Omit<RequestConfig, 'url' | 'method'> | undefined {
    if (!cfg) return undefined
    // ...rest 是对象解构赋值中的剩余操作符（Rest Operator），用于将解构后剩下的所有属性收集到一个新对象中。
    const { timeout, axiosConfig, ...rest } = cfg
    
    if (timeout === undefined) {
      return cfg
    }

    return {
      ...rest,
      axiosConfig: {
        timeout,
        ...axiosConfig
      }
    }
  }

  /**
   * 核心包装函数：永远 resolve [err, res]，绝不 reject
   */
  private async requestWrap<T = any, F = any>(
    requestPromise: Promise<{ httpCode: number; data?: BizApiResponse<T> }>,
    callbacks?: BizRequestCallbacks<T, F>,
    config?: BizRequestConfig
  ): Promise<BizResult<T, F>> {
    const { onSuccess, onFailed, onFinally } = callbacks || {}
    let errRes: ErrDataResponse<F> | null = null
    let successRes: BizApiResponse<T> | null = null

    try {
      const coreRes = await requestPromise
      const { httpCode, data: bizBody } = coreRes
    
    // ========== 1. 特殊处理 HTTP 204 No Content ==========
    if (httpCode === 204) {
          successRes = {
            bizCode: BizCodeRange.SUCCESS_204,
            data: undefined as unknown as T // 204 本身没有 body，返回 undefined
          }
        }

      // ========== 1. HTTP 状态码非 200 ==========
      else if (httpCode !== 200) {
        errRes = this.buildHttpCodeError<F>(httpCode, bizBody as Record<string, any>)
      } 
      
      // ========== 2. HTTP 200 但无返回体 ==========
      else if (!bizBody) {
        errRes = {
          bizCode: ClientErrorCode.HTTP_BODY_NULL_ERR,
        }
      } 

      // ========== 3. HTTP 200 解析业务 bizCode ==========
      else {
        const { bizCode, data } = bizBody
        const category = getBizCodeCategory(bizCode)
        
        if (category === 'success') {
          successRes = {
            bizCode,
            data: data as T
          }
        } else if (category === 'fail') {
          errRes = {
            bizCode,
            errData: data as F,
          }
        } else {
          errRes = {
            bizCode: ClientErrorCode.HTTP_UNKNOWN_ERR,
          }
        }
      }
    } catch (rawErr: any) {
      // ========== 4. 捕获底层异常（网络中断/超时/配置错误） ==========
      errRes = this.formatAxiosException<F>(rawErr)
    }

    // ========== 5. 处理 Callbacks ==========
    if (errRes) {
      try { onFailed?.(errRes) } catch (e) { console.error('[BizHttp] onFailed callback error:', e) }
    } else if (successRes) {
      try { onSuccess?.(successRes) } catch (e) { console.error('[BizHttp] onSuccess callback error:', e) }
    }

    try { onFinally?.() } catch (e) { console.error('[BizHttp] onFinally callback error:', e) }

    return [errRes, successRes]
  }

  /** 构建 HTTP 非 200 错误 */
  private buildHttpCodeError<F>(httpCode: number, rawRes?: Record<string, any>): ErrDataResponse<F> {
    let bizCode: ClientErrorCode = ClientErrorCode.HTTP_4XX_ERR
    if (httpCode >= 300 && httpCode < 400) bizCode = ClientErrorCode.HTTP_3XX_ERR
    else if (httpCode >= 500 && httpCode < 600) bizCode = ClientErrorCode.HTTP_5XX_ERR

    const message = rawRes?.message || rawRes?.msg || getHttpStatusMessage(httpCode)

    return {
      bizCode,
      clientErrData: { message, httpCode, rawServerRes: rawRes }
    }
  }

  /** 格式化 Axios 抛出的异常 */
  private formatAxiosException<F>(err: any): ErrDataResponse<F> {
    if (err.message?.includes('canceled') || err.message?.includes('cancelled') || err.code === 'ERR_CANCELED') {
      return {
        bizCode: ClientErrorCode.CONFIG_CANCEL,
        clientErrData: { message: ERROR_MESSAGES[ClientErrorCode.CONFIG_CANCEL] }
      }
    }

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('Network Error') || !err.response) {
      return {
        bizCode: ClientErrorCode.NET_TIMEOUT,
        clientErrData: {
          message: ERROR_MESSAGES[ClientErrorCode.NET_TIMEOUT],
          rawServerRes: err.config || undefined
        }
      }
    }

    if (err.response) {
      return this.buildHttpCodeError<F>(err.response.status, err.response.data)
    }

    return {
      bizCode: ClientErrorCode.HTTP_UNKNOWN_CLIENT_ERR,
      clientErrData: {
        message: err.message || ERROR_MESSAGES.unknownError,
        rawServerRes: err
      }
    }
  }

  private isCallbacks<T, F>(obj: any): obj is BizRequestCallbacks<T, F> {
    return (
      obj &&
      (typeof obj.onSuccess === 'function' ||
        typeof obj.onFailed === 'function' ||
        typeof obj.onFinally === 'function')
    )
  }

  private parseArgs<T, F>(arg2?: any, arg3?: any) {
    const cfg = this.isCallbacks(arg2) ? undefined : (arg2 as BizRequestConfig | undefined)
    const callbacks = this.isCallbacks(arg2) ? arg2 : (arg3 as BizRequestCallbacks<T, F> | undefined)
    return { cfg, callbacks }
  }

  // ========== 请求 API 封装 ==========

  get<T = any, F = any>(url: string, cfg?: BizRequestConfig, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  get<T = any, F = any>(url: string, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  get<T = any, F = any>(url: string, arg2?: any, arg3?: any): Promise<BizResult<T, F>> {
    const { cfg, callbacks } = this.parseArgs<T, F>(arg2, arg3)
    const finalCfg = this.normalizeConfig(cfg)
    return this.requestWrap<T, F>(this.httpManager.get<BizApiResponse<T>>(url, finalCfg), callbacks, cfg)
  }

  post<T = any, F = any>(url: string, data?: any, cfg?: BizRequestConfig, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  post<T = any, F = any>(url: string, data?: any, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  post<T = any, F = any>(url: string, data?: any, arg3?: any, arg4?: any): Promise<BizResult<T, F>> {
    const { cfg, callbacks } = this.parseArgs<T, F>(arg3, arg4)
    const finalCfg = this.normalizeConfig(cfg)
    return this.requestWrap<T, F>(this.httpManager.post<BizApiResponse<T>>(url, data, finalCfg), callbacks, cfg)
  }

  put<T = any, F = any>(url: string, data?: any, cfg?: BizRequestConfig, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  put<T = any, F = any>(url: string, data?: any, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  put<T = any, F = any>(url: string, data?: any, arg3?: any, arg4?: any): Promise<BizResult<T, F>> {
    const { cfg, callbacks } = this.parseArgs<T, F>(arg3, arg4)
    const finalCfg = this.normalizeConfig(cfg)
    return this.requestWrap<T, F>(this.httpManager.put<BizApiResponse<T>>(url, data, finalCfg), callbacks, cfg)
  }

  delete<T = any, F = any>(url: string, cfg?: BizRequestConfig, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  delete<T = any, F = any>(url: string, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  delete<T = any, F = any>(url: string, arg2?: any, arg3?: any): Promise<BizResult<T, F>> {
    const { cfg, callbacks } = this.parseArgs<T, F>(arg2, arg3)
    const finalCfg = this.normalizeConfig(cfg)
    return this.requestWrap<T, F>(this.httpManager.delete<BizApiResponse<T>>(url, finalCfg), callbacks, cfg)
  }

  patch<T = any, F = any>(url: string, data?: any, cfg?: BizRequestConfig, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  patch<T = any, F = any>(url: string, data?: any, callbacks?: BizRequestCallbacks<T, F>): Promise<BizResult<T, F>>
  patch<T = any, F = any>(url: string, data?: any, arg3?: any, arg4?: any): Promise<BizResult<T, F>> {
    const { cfg, callbacks } = this.parseArgs<T, F>(arg3, arg4)
    const finalCfg = this.normalizeConfig(cfg)
    return this.requestWrap<T, F>(this.httpManager.patch<BizApiResponse<T>>(url, data, finalCfg), callbacks, cfg)
  }
}

export const bizHttp = new BizHttp()