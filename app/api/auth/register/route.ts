import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase, requireText } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const body = await request.json();
  const username = requireText(body.username).toLowerCase();
  const displayName = requireText(body.displayName, username);
  const password = requireText(body.password);

  if (!username || !password) {
    return NextResponse.json({ message: "用户名和密码不能为空。" }, { status: 400 });
  }

  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      passwordHash: hashPassword(password),
      role: userCount === 0 ? "ADMIN" : "USER",
      profileSections: "offline,online,notes"
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      avatarUrl: true,
      backgroundUrl: true,
      bio: true,
      profileSections: true,
      createdAt: true
    }
  });

  return NextResponse.json({ user }, { status: 201 });
}
