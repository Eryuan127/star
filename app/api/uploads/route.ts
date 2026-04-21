import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
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

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "请选择要上传的图片或视频。" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ message: "仅支持 jpg、png、webp、gif、mp3、wav、ogg、mp4、mov、webm 文件。" }, { status: 400 });
  }

  const maxSize = file.type.startsWith("video/") ? 120 * 1024 * 1024 : file.type.startsWith("audio/") ? 40 * 1024 * 1024 : 12 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ message: file.type.startsWith("video/") ? "视频不能超过 120MB。" : file.type.startsWith("audio/") ? "音频不能超过 40MB。" : "图片不能超过 12MB。" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const extension = extensionByType[file.type] ?? path.extname(file.name).toLowerCase();
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
