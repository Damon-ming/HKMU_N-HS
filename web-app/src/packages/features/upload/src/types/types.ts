export interface UploadFile {
  name: string
  size: number
  type: string
  url?: string
  id?: string
}

export interface UploadResponse {
  server_time: string
  files: Array<{
    filename: string
    save_path: string
    file_size: number
    file_md5: string
    duplicate: boolean
    indexed: boolean
  }>
}

import type { BaseRequest } from '@ming/biz-common-net-api'
export interface UploadRequest extends BaseRequest { files: File[] }
