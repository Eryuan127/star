import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase } from "@/lib/cms";
import { videoPick } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ source: "fallback", video: videoPick });
  }

  const video = await prisma.videoSpotlight.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json({ source: "mysql", video });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  try {
    const body = await request.json();
    const video = await prisma.videoSpotlight.create({
      data: {
        title: String(body.title ?? ""),
        artist: String(body.artist ?? ""),
        publishDate: String(body.publishDate ?? ""),
        reason: String(body.reason ?? ""),
        note: String(body.note ?? ""),
        videoUrl: body.videoUrl ? String(body.videoUrl) : null,
        coverUrl: body.coverUrl ? String(body.coverUrl) : null,
        isActive: true
      }
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "顶部视频保存失败，请检查链接或稍后再试。" }, { status: 500 });
  }
}
