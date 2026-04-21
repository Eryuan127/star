import { NextResponse } from "next/server";
import { fallbackCmsData, hasDatabase } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json(fallbackCmsData());
  }

  const [video, schedules, musicTracks, entries, goals, skills] = await Promise.all([
    prisma.videoSpotlight.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.artistSchedule.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.musicTrack.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.diaryEntry.findMany({
      include: { tags: true, author: { select: { id: true, displayName: true, username: true } } },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.goal.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.skill.findMany({
      include: { achievements: { orderBy: { updatedAt: "desc" } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    })
  ]);

  return NextResponse.json({
    source: "mysql",
    video,
    schedules,
    musicTracks,
    entries,
    goals,
    skills
  });
}
