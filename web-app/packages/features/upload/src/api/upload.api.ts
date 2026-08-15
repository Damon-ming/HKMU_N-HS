import { dataApi } from '@ming/data-layer'
import type { BizApiResponse } from '@ming/biz-common-net-api'
import type { UploadRequest, UploadResponse } from '../types/types'

/** 服务端上传接口实现。请求实体由 hook 层创建并透传。 */
/** @internal */
export async function uploadFile(request: UploadRequest): Promise<BizApiResponse<UploadResponse>> {
  const formData = new FormData()
  request.files.forEach(file => formData.append('files', file, file.name))
  return dataApi.post<UploadResponse>('/api/v1/files/upload', formData)
}
