import type { UploadFile } from '../types'
export const toUploadFile = (file: File): UploadFile => ({ name: file.name, size: file.size, type: file.type })
