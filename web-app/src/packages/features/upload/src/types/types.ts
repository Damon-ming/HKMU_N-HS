export interface UploadFile {
  name: string
  size: number
  type: string
  url?: string
  id?: string
}

export interface UploadResponse {
  id: string
  url: string
  name: string
  size: number
  type: string
}

import type { BaseRequest } from '@ming/biz-common-net-api'
export interface UploadRequest extends BaseRequest { files: File[] }
