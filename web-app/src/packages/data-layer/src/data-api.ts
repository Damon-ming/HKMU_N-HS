// web-app/src/packages/data-layer/src/data-api.ts
import { netClient, type BizRequestConfig, type BizApiResponse } from '@ming/biz-common-net-api'
import { unwrapBizResult } from './unwrapper'

/**
 * 纯函数组合工具：对 netClient 进行二次封装，自动进行 unwrap 解包
 */
export const dataApi = {
  get<T = any, F = any>(url: string, config?: BizRequestConfig): Promise<BizApiResponse<T>> {
    return unwrapBizResult<T, F>(netClient.get<T, F>(url, config))
  },

  post<T = any, F = any>(url: string, data?: any, config?: BizRequestConfig): Promise<BizApiResponse<T>> {
    return unwrapBizResult<T, F>(netClient.post<T, F>(url, data, config))
  },

  put<T = any, F = any>(url: string, data?: any, config?: BizRequestConfig): Promise<BizApiResponse<T>> {
    return unwrapBizResult<T, F>(netClient.put<T, F>(url, data, config))
  },

  delete<T = any, F = any>(url: string, config?: BizRequestConfig): Promise<BizApiResponse<T>> {
    return unwrapBizResult<T, F>(netClient.delete<T, F>(url, config))
  },

  patch<T = any, F = any>(url: string, data?: any, config?: BizRequestConfig): Promise<BizApiResponse<T>> {
    return unwrapBizResult<T, F>(netClient.patch<T, F>(url, data, config))
  }
}