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

export interface UploadRequest {
  file: File
  fileName: string
  contentType: string
  size: number
}
