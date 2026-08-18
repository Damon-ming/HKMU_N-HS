// web-app/src/packages/data-layer/src/types.ts
import type { BizApiResponse, ErrDataResponse, BizRequestConfig } from '@ming/biz-common-net-api'
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'

/** 
 * 单次数据层请求配置，透传底层的 BizRequestConfig
 */
export type DataLayerRequestConfig = BizRequestConfig

/** 
 * TanStack Query 配置的类型别名封装
 * 解耦对 TanStack Query 具体泛型复杂度的依赖
 */
export type BaseQueryOptions<TData = any, TError = ErrDataResponse> = 
  Omit<UseQueryOptions<BizApiResponse<TData>, TError, BizApiResponse<TData>>, 'queryKey' | 'queryFn'>

export type BaseMutationOptions<TData = any, TVariables = void, TError = ErrDataResponse> = 
  Omit<UseMutationOptions<BizApiResponse<TData>, TError, TVariables>, 'mutationFn'>