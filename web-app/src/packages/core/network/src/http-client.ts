// src/packages/core/network/src/http-client.ts
import axios, {  InternalAxiosRequestConfig, AxiosHeaderValue, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { RequestConfig, HttpClientConfig, ApiResponse, InterceptorConfig } from './types'

export class HttpClient {
  private instance: AxiosInstance

  // 存储拦截器 ID，用于清理
private globalRequestInterceptors: InterceptorConfig<InternalAxiosRequestConfig>[] = []
  private globalResponseInterceptors: InterceptorConfig<AxiosResponse>[] = []

  constructor(config: HttpClientConfig) {

    if (typeof config.baseURL !== 'string') throw new Error('HttpClientConfig.baseURL must be string')

    this.instance = axios.create({
      baseURL: config.baseURL,
      headers: config.headers ?? {},
      ...config.axiosConfig
    })

     this.setupInterceptors(config.interceptors)
  }

private setupInterceptors(interceptors: HttpClientConfig['interceptors']) {
    if (!interceptors) return

    if (interceptors.request) {
      const reqs = Array.isArray(interceptors.request) ? interceptors.request : [interceptors.request]
      this.globalRequestInterceptors.push(...reqs)
    }

    if (interceptors.response) {
      const resps = Array.isArray(interceptors.response) ? interceptors.response : [interceptors.response]
      this.globalResponseInterceptors.push(...resps)
    }
  }

  /** 动态添加全局请求拦截器 */
  addRequestInterceptor(interceptor: InterceptorConfig<InternalAxiosRequestConfig> | InterceptorConfig<InternalAxiosRequestConfig>[]): () => void {
    const list = Array.isArray(interceptor) ? interceptor : [interceptor]
    this.globalRequestInterceptors.push(...list)

    return () => {
      this.globalRequestInterceptors = this.globalRequestInterceptors.filter(i => !list.includes(i))
    }
  }

  /** 动态添加全局响应拦截器 */
  addResponseInterceptor(interceptor: InterceptorConfig<AxiosResponse> | InterceptorConfig<AxiosResponse>[]): () => void {
    const list = Array.isArray(interceptor) ? interceptor : [interceptor]
    this.globalResponseInterceptors.push(...list)

    return () => {
      this.globalResponseInterceptors = this.globalResponseInterceptors.filter(i => !list.includes(i))
    }
  }

  /**
   * 获取 axios 实例（用于高级操作）
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance
  }

async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    let axiosCfg: AxiosRequestConfig = {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data,
      headers: config.headers,
      ...config.axiosConfig
    }

    // 补全必要的默认字段以符合 InternalAxiosRequestConfig 类型
    let finalAxiosCfg = axiosCfg as InternalAxiosRequestConfig
    finalAxiosCfg.headers = finalAxiosCfg.headers || {}

    // 这是 JavaScript 的对象解构赋值，用于从 config 对象中提取 interceptors 属性，并重命名为 singleInterceptors
    const { interceptors: singleInterceptors } = config

    // ==================== 1. 请求拦截阶段 (Request) ====================
    // 1.1 执行 [全局] 请求拦截器
    // of 是 for...of 循环的关键词，用于遍历可迭代对象（如数组）中的每个元素。
    for (const interceptor of this.globalRequestInterceptors) {
      try {
        if (interceptor.onFulfilled) {
          finalAxiosCfg = await interceptor.onFulfilled(finalAxiosCfg)
        }
      } catch (err) {
        if (interceptor.onRejected) {
          await interceptor.onRejected(err)
        }
        throw err
      }
    }

    // 1.2 执行 [单次] 请求拦截器（此时拿到的是已被全局拦截器修改过的 config）
    if (singleInterceptors?.request) {
      try {
        if (singleInterceptors.request.onFulfilled) {
          finalAxiosCfg = await singleInterceptors.request.onFulfilled(finalAxiosCfg)
        }
      } catch (err) {
        if (singleInterceptors.request.onRejected) {
          await singleInterceptors.request.onRejected(err)
        }
        throw err
      }
    }

    // ==================== 2. 发起网络请求 ====================
    let rawRes: AxiosResponse<T>
    try {
      // 注意：使用 axios.request 基础方法，避免触发 axios 实例上的重复拦截器
      rawRes = await this.instance.request<T>(finalAxiosCfg)
    } catch (networkErr) {
      // 网络请求失败时的异常处理流
      let handledErr = networkErr

      // 尝试让全局响应 onRejected 处理
      for (const interceptor of this.globalResponseInterceptors) {
        if (interceptor.onRejected) {
          try {
            handledErr = await interceptor.onRejected(handledErr)
          } catch (e) {
            handledErr = e
          }
        }
      }

      // 尝试让单次响应 onRejected 处理
      if (singleInterceptors?.response?.onRejected) {
        handledErr = await singleInterceptors.response.onRejected(handledErr)
      }

      throw handledErr
    }

    // ==================== 3. 响应拦截阶段 (Response) ====================
    // 3.1 执行 [全局] 响应拦截器
    for (const interceptor of this.globalResponseInterceptors) {
      try {
        if (interceptor.onFulfilled) {
          rawRes = await interceptor.onFulfilled(rawRes)
        }
      } catch (err) {
        if (interceptor.onRejected) {
          await interceptor.onRejected(err)
        }
        throw err
      }
    }

    // 3.2 执行 [单次] 响应拦截器（此时拿到的是已经被全局响应拦截器处理过的 response）
    if (singleInterceptors?.response) {
      try {
        if (singleInterceptors.response.onFulfilled) {
          rawRes = await singleInterceptors.response.onFulfilled(rawRes)
        }
      } catch (err) {
        if (singleInterceptors.response.onRejected) {
          await singleInterceptors.response.onRejected(err)
        }
        throw err
      }
    }

    return {
      httpCode: rawRes.status,
      data: rawRes.data
    }
  }
  
/** GET 请求，统一返回 ApiResponse */
  async get<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', ...config })
  }

  /** POST 请求，统一返回 ApiResponse */
  async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, ...config })
  }

  /** PUT 请求，统一返回 ApiResponse */
  async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...config })
  }

  /** DELETE 请求，统一返回 ApiResponse */
  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', ...config })
  }

  /** PATCH 请求，统一返回 ApiResponse */
  async patch<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', data, ...config })
  }

  createChild(config: Partial<HttpClientConfig>): HttpClient {
    // instance.defaults 实例的默认配置
    const currentConfig = this.instance.defaults

    // 清洗父 common headers，剔除值为 undefined 的属性
    // 表示一个键为字符串、值为 AxiosHeaderValue 类型的对象。	AxiosHeaderValue值（value）的类型是 Axios 定义的 header 值类型
    const parentCommonHeaders: Record<string, AxiosHeaderValue> = {}
    const commonHeaders = currentConfig.headers.common ?? {}
    // currentConfig.headers.common 是指当前请求配置对象中，专门用于存放所有请求方法通用的 HTTP 头部信息的对象。
    for (const [key, value] of Object.entries(commonHeaders)) {
      //undefined:变量未赋值
      if (value !== undefined) {
        parentCommonHeaders[key] = value
      }
    }

    // 合并父子配置：子配置优先级高于父
    const childConfig: HttpClientConfig = {
      baseURL: config.baseURL ?? (currentConfig.baseURL ?? ''),
      headers: {
        ...parentCommonHeaders,
        ...config.headers
      },
      axiosConfig: {
        ...this.omit(currentConfig, ['baseURL', 'timeout', 'headers']),
        ...config.axiosConfig
      },

      interceptors: config.interceptors,
    }

    return new HttpClient(childConfig)
  }
  
  // keyof 是 TypeScript 中的索引类型查询操作符（Index Type Query Operator），用于获取一个类型的所有属性键组成的联合类型。
  // keyof Person 就是把 Person 的属性名提取出来，变成一个"字符串联合类型"。
  private omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const copy = { ...obj }
    keys.forEach(k => delete copy[k])
    return copy
  }
}