import { NextResponse } from "next/server";
import {
  databaseMissingResponse,
  hasDatabase,
  isAdminUser,
  normalizeEntryType,
  requireText,
  sanitizeOptionalText,
  toArrayTags
} from "@/lib/cms";
import { offlineEntries, onlineEntries } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({
      source: "fallback",
      entries: [...offlineEntries, ...onlineEntries]
    });
  }

  const entries = await prisma.diaryEntry.findMany({
    include: { tags: true, author: { select: { id: true, displayName: true, username: true } } },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ source: "mysql", entries });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const tags = toArrayTags(body.tags);
  const title = requireText(body.title);
  const summary = requireText(body.summary);

  if (!title || !summary) {
    return NextResponse.json({ message: "标题和正文不能为空。" }, { status: 400 });
  }

  const entry = await prisma.diaryEntry.create({
    data: {
      type: normalizeEntryType(body.type),
      title,
      dateText: requireText(body.dateText, new Date().toLocaleDateString("zh-CN")),
      location: sanitizeOptionalText(body.location),
      artist: sanitizeOptionalText(body.artist),
      summary,
      highlight: sanitizeOptionalText(body.highlight),
      mediaUrl: sanitizeOptionalText(body.mediaUrl),
      isPinned: Boolean(body.isPinned),
      authorId: sanitizeOptionalText(body.authorId),
      tags: {
        create: tags.map((name) => ({ name }))
      }
    },
    include: { tags: true, author: { select: { id: true, displayName: true, username: true } } }
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function PUT(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const id = requireText(body.id);
  const title = requireText(body.title);
  const summary = requireText(body.summary);

  if (!id) {
    return NextResponse.json({ message: "缺少要修改的文档 ID。" }, { status: 400 });
  }

  if (!title || !summary) {
    return NextResponse.json({ message: "标题和正文不能为空。" }, { status: 400 });
  }

  const tags = toArrayTags(body.tags);
  const entry = await prisma.diaryEntry.update({
    where: { id },
    data: {
      type: normalizeEntryType(body.type),
      title,
      dateText: requireText(body.dateText, new Date().toLocaleDateString("zh-CN")),
      location: sanitizeOptionalText(body.location),
      artist: sanitizeOptionalText(body.artist),
      summary,
      highlight: sanitizeOptionalText(body.highlight),
      mediaUrl: sanitizeOptionalText(body.mediaUrl),
      isPinned: Boolean(body.isPinned),
      authorId: sanitizeOptionalText(body.authorId),
      tags: {
        deleteMany: {},
        create: tags.map((name) => ({ name }))
      }
    },
    include: { tags: true, author: { select: { id: true, displayName: true, username: true } } }
  });

  return NextResponse.json(entry);
}

export async function DELETE(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = requireText(searchParams.get("id"));
  const requesterId = requireText(searchParams.get("requesterId"));

  if (!id) {
    return NextResponse.json({ message: "缺少要删除的文档 ID。" }, { status: 400 });
  }

  if (!(await isAdminUser(requesterId))) {
    return NextResponse.json({ message: "只有管理员可以删除文档。" }, { status: 403 });
  }

  await prisma.diaryEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
