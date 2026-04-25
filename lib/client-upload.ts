"use client";

import { upload } from "@vercel/blob/client";

function sanitizeFilename(name: string) {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, "-").trim();
  return cleaned || "upload";
}

function getUploadPath(file: File) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `uploads/${Date.now()}-${id}-${sanitizeFilename(file.name)}`;
}

async function uploadThroughApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads", { method: "POST", body: formData });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "上传失败。");
  }

  return String(result.url);
}

export async function uploadMediaFile(file: File, onProgress?: (percentage: number) => void) {
  try {
    const blob = await upload(getUploadPath(file), file, {
      access: "public",
      handleUploadUrl: "/api/uploads",
      clientPayload: JSON.stringify({ contentType: file.type, size: file.size }),
      contentType: file.type,
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => onProgress?.(percentage)
    });

    return blob.url;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return uploadThroughApi(file);
  }
}
