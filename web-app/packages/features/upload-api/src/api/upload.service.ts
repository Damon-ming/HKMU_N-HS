import { toUploadFile } from '@ming/features-upload'
export const normalizeUpload = (file: File) => toUploadFile(file)
