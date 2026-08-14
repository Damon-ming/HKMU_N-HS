import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, QueryKey } from '@tanstack/react-query'
import type { BizApiResponse, ErrDataResponse } from '@ming/biz-common-net-api'

export class QueryFactory {
  /**
   * 创建通用 Fetch (Query) Hook 的基准方法
   */
  // = "如果调用时没有指定 TData，就使用 any 作为默认类型。"
  // TData = "这次请求返回什么类型的数据？"
// TError = "如果出错了，错误是什么格式？"
// TQueryKey = "缓存的 key 是什么类型的？"
  static createQuery<TData = any, TError = ErrDataResponse, TQueryKey extends QueryKey = QueryKey>(
    queryKey: TQueryKey,
    fetcher: () => Promise<BizApiResponse<TData>>,
    options?: Omit<UseQueryOptions<BizApiResponse<TData>, TError, BizApiResponse<TData>, TQueryKey>, 'queryKey' | 'queryFn'>
  ) {
    // 因为 queryKey 和 queryFn 你已经作为独立参数传了
    // options 里就不需要再传这两个了
    return useQuery<BizApiResponse<TData>, TError, BizApiResponse<TData>, TQueryKey>({
      queryKey,
      queryFn: fetcher,
      ...options,
    })
  }

  /**
   * 创建通用 Action (Mutation) Hook 的基准方法
   * TData	any	响应数据类型。比如 User、{ success: boolean }
   * TVariables	void	请求参数类型。比如 { name: string }、number
   */
  static createMutation<TData = any, TVariables = void, TError = ErrDataResponse>(
    mutationFn: (variables: TVariables) => Promise<BizApiResponse<TData>>,
    options?: Omit<UseMutationOptions<BizApiResponse<TData>, TError, TVariables>, 'mutationFn'>
  ) {
    return useMutation<BizApiResponse<TData>, TError, TVariables>({
      mutationFn,
      ...options,
    })
  }
}