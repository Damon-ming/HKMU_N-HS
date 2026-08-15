import { dataApi } from '@ming/data-layer'
import type { UploadRequest, UploadResponse } from '../types/types'

/** 服务端上传接口实现。请求实体由 hook 层创建并透传。 */
/** @internal */
export async function _uploadFile(request: UploadRequest): Promise<UploadResponse> {
  const response = await dataApi.post<UploadResponse>('/api/v1/files/upload', request)
  if (!response.data) throw new Error('文件上传成功但服务端未返回文件信息')
  return response.data
}