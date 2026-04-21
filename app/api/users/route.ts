import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase, isAdminUser, requireText, sanitizeOptionalText } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const { searchParams } = new URL(request.url);
  const requesterId = requireText(searchParams.get("requesterId"));

  if (!(await isAdminUser(requesterId))) {
    return NextResponse.json({ message: "只有管理员可以查看用户列表。" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, displayName: true, role: true, avatarUrl: true, backgroundUrl: true, bio: true, profileSections: true, createdAt: true }
  });

  return NextResponse.json({ users });
}

export async function PUT(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const id = requireText(body.id);
  const requesterId = requireText(body.requesterId);

  if (!id || (id !== requesterId && !(await isAdminUser(requesterId)))) {
    return NextResponse.json({ message: "只能修改自己的个人资料。" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      displayName: requireText(body.displayName, "未命名用户"),
      avatarUrl: sanitizeOptionalText(body.avatarUrl),
      backgroundUrl: sanitizeOptionalText(body.backgroundUrl),
      bio: sanitizeOptionalText(body.bio),
      profileSections: requireText(body.profileSections, "offline,online,notes")
    },
    select: { id: true, username: true, displayName: true, role: true, avatarUrl: true, backgroundUrl: true, bio: true, profileSections: true, createdAt: true }
  });

  return NextResponse.json({ user });
}

export async function DELETE(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = requireText(searchParams.get("id"));
  const requesterId = requireText(searchParams.get("requesterId"));

  if (!(await isAdminUser(requesterId))) {
    return NextResponse.json({ message: "只有管理员可以删除用户。" }, { status: 403 });
  }

  if (!id || id === requesterId) {
    return NextResponse.json({ message: "不能删除当前管理员账号。" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
