import { dataApi } from '@ming/data-layer'
import type { BizApiResponse } from '@ming/biz-common-net-api'
import type { UploadRequest, UploadResponse } from '../types/types'
import { createLogger } from '@ming/core-log'

const log = createLogger('upload/api')

/** 服务端上传接口实现。请求实体由 hook 层创建并透传。 */
/** @internal */
export async function uploadFile(request: UploadRequest): Promise<BizApiResponse<UploadResponse>> {
  log.debug('upload request', { endpoint: '/api/files/upload/v1', fileCount: request.files.length })
  const formData = new FormData()
  request.files.forEach(file => formData.append('files', file, file.name))
  try {
    const response = await dataApi.post<UploadResponse>('/api/files/upload/v1', formData)
    log.debug('upload response received')
    return response
  } catch (error) {
    log.error('upload request failed', error)
    throw error
  }
}
