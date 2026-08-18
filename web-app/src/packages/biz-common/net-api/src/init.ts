// src/packages/biz-common/net-api/src/init.ts

import { bizHttp, BizHttpClientConfig } from '@ming/biz-common-net'
import { HttpClient } from '@ming/core-network'

/**
 * 全局网络层初始化函数（在主入口 main 中调用）
 */
export function initNetApi(config: BizHttpClientConfig): HttpClient {
  return bizHttp.init(config)
}