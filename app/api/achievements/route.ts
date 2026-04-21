import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase, requireText, sanitizeOptionalText } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const skillId = requireText(body.skillId);
  const title = requireText(body.title);
  const detail = requireText(body.detail);

  if (!skillId || !title || !detail) {
    return NextResponse.json({ message: "技能、成就标题和内容不能为空。" }, { status: 400 });
  }

  const achievement = await prisma.skillAchievement.create({
    data: {
      skillId,
      title,
      detail,
      dateText: sanitizeOptionalText(body.dateText)
    }
  });

  return NextResponse.json(achievement, { status: 201 });
}
