import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const allowedTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-wav",
  "video/mp4",
  "video/quicktime",
  "video/webm"
]);

const extensionByType: Record<string, string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
  "audio/webm": ".webm",
  "audio/x-wav": ".wav",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm"
};

function getMaxSize(contentType: string) {
  if (contentType.startsWith("video/")) return 120 * 1024 * 1024;
  if (contentType.startsWith("audio/")) return 40 * 1024 * 1024;
  return 12 * 1024 * 1024;
}

function buildFilename(file: File) {
  const extension = extensionByType[file.type] ?? path.extname(file.name).toLowerCase();
  return `${Date.now()}-${randomUUID()}${extension}`;
}

async function writeLocalUpload(file: File, filename: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/${filename}`;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { message: "请先在部署平台配置 BLOB_READ_WRITE_TOKEN，再使用线上上传。" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) as { contentType?: string; size?: number } : {};
        const uploadedType = String(payload.contentType ?? "");
        const uploadedSize = Number(payload.size ?? 0);

        if (!allowedTypes.has(uploadedType)) {
          throw new Error("不支持这个文件类型。");
        }

        return {
          allowedContentTypes: [uploadedType],
          maximumSizeInBytes: getMaxSize(uploadedType),
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ size: uploadedSize })
        };
      },
      onUploadCompleted: async () => {}
    });

    return NextResponse.json(response);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "请选择要上传的图片、音频或视频。" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ message: "仅支持 jpg、png、webp、gif、mp3、wav、ogg、mp4、mov、webm 文件。" }, { status: 400 });
  }

  const maxSize = getMaxSize(file.type);
  if (file.size > maxSize) {
    return NextResponse.json({ message: file.type.startsWith("video/") ? "视频不能超过 120MB。" : file.type.startsWith("audio/") ? "音频不能超过 40MB。" : "图片不能超过 12MB。" }, { status: 400 });
  }

  const filename = buildFilename(file);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      addRandomSuffix: false
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "请先在部署平台配置 BLOB_READ_WRITE_TOKEN，再使用线上上传。" },
      { status: 503 }
    );
  }

  const url = await writeLocalUpload(file, filename);
  return NextResponse.json({ url }, { status: 201 });
}
