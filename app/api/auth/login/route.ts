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
  const password = requireText(body.password);

  if (!username || !password) {
    return NextResponse.json({ message: "用户名和密码不能为空。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      avatarUrl: true,
      backgroundUrl: true,
      bio: true,
      profileSections: true,
      passwordHash: true,
      createdAt: true
    }
  });

  if (!user || user.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ message: "用户名或密码不正确。" }, { status: 401 });
  }

  const { passwordHash, ...safeUser } = user;
  void passwordHash;

  return NextResponse.json({ user: safeUser });
}
