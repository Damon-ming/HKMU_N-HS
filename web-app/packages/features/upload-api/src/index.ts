import { uploadFile } from '@ming/features-upload'
export function useUploadApi(file:File) { return  uploadFile(file) }