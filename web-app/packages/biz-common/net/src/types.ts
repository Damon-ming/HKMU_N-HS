// packages/biz-common-net/src/types.ts

import { HttpClientConfig, RequestConfig } from "@ming/core-network"

/**
 * 单次业务请求配置 (BizRequestConfig)
 * 复用 core 的 RequestConfig (剔除 url 和 method)，并补充/覆盖业务特有配置
 */
export type BizRequestConfig = Omit<RequestConfig, 'url' | 'method'> & {
  /** 单次请求超时时间（单位：毫秒） */
  timeout?: number
}

export interface BaseRequest {
  requestId?: string
  requestedAt?: number
}

/**
 * 全局启动/初始化网络配置 (BizHttpClientConfig)
 * 继承 core 的 HttpClientConfig，并定义业务启动层需要的字段
 */
export interface BizHttpClientConfig extends HttpClientConfig {
  /** 默认请求超时时间，默认 10000ms */
  timeout?: number
}

/** 后端标准错误详情 ErrDataResponse */
export interface ErrDataResponse<ErrData = any> {
  bizCode: number
  clientErrData?: ClientErrData // 只有客户端抛出异常或处理网络错误时存在
  errData?: ErrData 
}

/** 业务层包装后的完整响应 = 底层http壳 + 后端业务体 */
export interface BizApiResponse<T = any> {
  bizCode: number
  data?: T
}

/** 客户端专属错误信息（仅网络/配置/HTTP非200时存在） */
export interface ClientErrData {
  message?: string
  httpCode?: number // 携带原始HTTP状态码 301/404/500
  rawServerRes?: Record<string, any> // 后端返回原生错误体 {code,message,path...}
}

/** 请求回调集合 */
export interface BizRequestCallbacks<T = any, F = any> {
  onSuccess?: (res: BizApiResponse<T>) => void
  onFailed?: (error: ErrDataResponse<F>) => void
  onFinally?: () => void
}

/** 
 * 核心：元组返回格式 [ErrDataResponse | null, BizApiResponse | null]
 * 失败：[ErrDataResponse, null]
 * 成功：[null, BizApiResponse]
 */
export type BizResult<T = any, F = any> = [ErrDataResponse<F> | null, BizApiResponse<T> | null]
