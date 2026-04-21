import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase, normalizeScheduleStatus } from "@/lib/cms";
import { scheduleItems } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ source: "fallback", schedules: scheduleItems });
  }

  const schedules = await prisma.artistSchedule.findMany({
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json({ source: "mysql", schedules });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const schedule = await prisma.artistSchedule.create({
    data: {
      dateText: String(body.dateText ?? ""),
      artist: String(body.artist ?? ""),
      title: String(body.title ?? ""),
      status: normalizeScheduleStatus(body.status),
      note: body.note ? String(body.note) : null,
      linkUrl: body.linkUrl ? String(body.linkUrl) : null
    }
  });

  return NextResponse.json(schedule, { status: 201 });
}

export async function PUT(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const schedule = await prisma.artistSchedule.update({
    where: { id: String(body.id ?? "") },
    data: {
      dateText: String(body.dateText ?? ""),
      artist: String(body.artist ?? ""),
      title: String(body.title ?? ""),
      status: normalizeScheduleStatus(body.status),
      note: body.note ? String(body.note) : null,
      linkUrl: body.linkUrl ? String(body.linkUrl) : null
    }
  });

  return NextResponse.json(schedule);
}

export async function DELETE(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") ?? "");

  if (!id) {
    return NextResponse.json({ message: "缺少要删除的行程 ID。" }, { status: 400 });
  }

  await prisma.artistSchedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
