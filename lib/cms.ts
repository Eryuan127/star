import {
  goals,
  musicTracks,
  notes,
  offlineEntries,
  onlineEntries,
  scheduleItems,
  skills,
  videoPick
} from "@/lib/data";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function databaseMissingResponse() {
  return Response.json(
    { message: "请先配置 DATABASE_URL 并执行 npm run db:push 后再写入 MySQL。" },
    { status: 503 }
  );
}

export function fallbackCmsData() {
  return {
    source: "fallback",
    video: videoPick,
    schedules: scheduleItems,
    musicTracks,
    entries: [...offlineEntries, ...onlineEntries],
    goals,
    skills,
    notes
  };
}

export function toArrayTags(tags: unknown) {
  if (Array.isArray(tags)) {
    return tags.map(String).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeEntryType(type: unknown) {
  const value = String(type ?? "OFFLINE").toUpperCase();
  if (value === "ONLINE" || value === "NOTE") {
    return value;
  }

  return "OFFLINE";
}

export function sanitizeOptionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export function requireText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

export async function isAdminUser(userId: unknown) {
  const id = sanitizeOptionalText(userId);

  if (!id) {
    return false;
  }

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true }
  });

  return user?.role === "ADMIN";
}

export function normalizeGoalStatus(status: unknown) {
  const value = String(status ?? "IN_PROGRESS").toUpperCase();
  if (value === "PLANNED" || value === "DONE") {
    return value;
  }

  return "IN_PROGRESS";
}

export function normalizeScheduleStatus(status: unknown) {
  const value = String(status ?? "PLANNED").toUpperCase();
  if (value === "IN_PROGRESS" || value === "DONE" || value === "ARCHIVED") {
    return value;
  }

  return "PLANNED";
}
