import { _uploadFile as requestUploadFile } from '../api'
import type { UploadRequest, UploadResponse } from '../types/types'

function createUploadRequest(file: File): UploadRequest {
  if (!file.type.startsWith('image/')) throw new Error('只允许上传图片文件')
  if (file.size > 10 * 1024 * 1024) throw new Error('图片大小不能超过 10MB')
  return { file, fileName: file.name, contentType: file.type, size: file.size }
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  return requestUploadFile(createUploadRequest(file))
}