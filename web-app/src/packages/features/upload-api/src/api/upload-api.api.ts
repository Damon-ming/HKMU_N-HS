import { uploadFile } from "@ming/features-upload"
export function useUploadApi(files: File[]) { return uploadFile(files) }
