import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase, normalizeGoalStatus } from "@/lib/cms";
import { goals } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ source: "fallback", goals });
  }

  const rows = await prisma.goal.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ source: "mysql", goals: rows });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const goal = await prisma.goal.create({
    data: {
      title: String(body.title ?? ""),
      detail: String(body.detail ?? ""),
      progress: Number(body.progress ?? 0),
      status: normalizeGoalStatus(body.status),
      dueText: body.dueText ? String(body.dueText) : null
    }
  });

  return NextResponse.json(goal, { status: 201 });
}

export async function PUT(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const goal = await prisma.goal.update({
    where: { id: String(body.id ?? "") },
    data: {
      title: String(body.title ?? ""),
      detail: String(body.detail ?? ""),
      progress: Number(body.progress ?? 0),
      status: normalizeGoalStatus(body.status),
      dueText: body.dueText ? String(body.dueText) : null
    }
  });

  return NextResponse.json(goal);
}
