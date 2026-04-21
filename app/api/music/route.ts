import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase, requireText } from "@/lib/cms";
import { musicTracks } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ source: "fallback", musicTracks });
  }

  const tracks = await prisma.musicTrack.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ source: "mysql", musicTracks: tracks });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  try {
    const body = await request.json();
    const track = await prisma.musicTrack.create({
      data: {
        artist: String(body.artist ?? ""),
        title: String(body.title ?? ""),
        mood: String(body.mood ?? ""),
        accent: String(body.accent ?? "#D97F9F"),
        audioUrl: body.audioUrl ? String(body.audioUrl) : null,
        sortOrder: Math.max(-10000, Math.min(10000, Number(body.sortOrder ?? 0)))
      }
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "歌曲添加失败，请检查链接或稍后再试。" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = requireText(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ message: "缺少要删除的歌曲 ID。" }, { status: 400 });
  }

  await prisma.musicTrack.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
