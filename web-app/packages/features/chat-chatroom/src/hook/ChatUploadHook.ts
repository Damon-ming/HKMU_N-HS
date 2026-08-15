import { useState } from "react";
import { useUploadApi } from "@ming/features-upload-api";

export function chatUploadHook() {
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (fileList?: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;

    setFileName(files.map((file) => file.name).join(", "));
    setError("");
    setUploading(true);
    try {
      await useUploadApi(files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  return { fileName, uploading, error, handleFileChange };
}
