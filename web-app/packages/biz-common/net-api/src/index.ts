// packages/biz-common/net-api/index.ts

// 1. 导出初始化逻辑与全局客户端
export { initNetApi} from './init'

// 2. 导出常用业务网络类型（来自 biz-common-net）
export type {
  BizApiResponse,
  BaseRequest,
  BizResult,
  ErrDataResponse,
  BizRequestConfig,
  BizHttpClientConfig,
  ClientErrData,
  BizHttp,
  ClientErrorCode, BizCodeRange
} from '@ming/biz-common-net'

/**
 * 导出全局网络 Client 实例
 * 业务模块（如 chat）直接使用该实例发起业务请求
 */
import { bizHttp,BizHttp } from '@ming/biz-common-net'
export const netClient: BizHttp = bizHttp
