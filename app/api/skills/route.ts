import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase } from "@/lib/cms";
import { skills } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ source: "fallback", skills });
  }

  const rows = await prisma.skill.findMany({
    include: { achievements: { orderBy: { updatedAt: "desc" } } },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ source: "mysql", skills: rows });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const skill = await prisma.skill.create({
    data: {
      name: String(body.name ?? ""),
      level: String(body.level ?? ""),
      copy: String(body.copy ?? ""),
      sortOrder: Number(body.sortOrder ?? 0),
      mediaUrl: body.mediaUrl ? String(body.mediaUrl) : null,
      artist: body.artist ? String(body.artist) : null
    }
  });

  return NextResponse.json(skill, { status: 201 });
}

export async function PUT(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const skill = await prisma.skill.update({
    where: { id: String(body.id ?? "") },
    data: {
      name: String(body.name ?? ""),
      level: String(body.level ?? ""),
      copy: String(body.copy ?? ""),
      sortOrder: Number(body.sortOrder ?? 0),
      mediaUrl: body.mediaUrl ? String(body.mediaUrl) : null,
      artist: body.artist ? String(body.artist) : null
    },
    include: { achievements: { orderBy: { updatedAt: "desc" } } }
  });

  return NextResponse.json(skill);
}
