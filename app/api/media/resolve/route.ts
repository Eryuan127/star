import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/uploads/")) return trimmed;
  if (/^(www\.|m\.|b23\.|bilibili\.|youtube\.|youtu\.be)/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function buildBilibiliEmbed(url: string) {
  const bvid = url.match(/BV[0-9A-Za-z]+/i)?.[0];
  if (bvid) {
    return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&autoplay=0&muted=1&high_quality=1`;
  }

  const aid = url.match(/(?:\/video\/av|[?&]aid=|av)(\d+)/i)?.[1];
  if (aid) {
    return `https://player.bilibili.com/player.html?aid=${aid}&page=1&autoplay=0&muted=1&high_quality=1`;
  }

  return "";
}

function getEmbeddableVideoUrl(value: string) {
  const url = normalizeExternalUrl(value);
  if (!url) return "";

  const bilibiliEmbed = buildBilibiliEmbed(url);
  if (bilibiliEmbed) return bilibiliEmbed;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=0&mute=1&playsinline=1&rel=0` : "";
    }

    if (host.includes("youtube.com")) {
      const id = parsed.searchParams.get("v") ?? parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1] ?? parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=0&mute=1&playsinline=1&rel=0` : "";
    }
  } catch {
    return "";
  }

  return "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originalUrl = normalizeExternalUrl(searchParams.get("url") ?? "");

  if (!originalUrl || originalUrl.startsWith("/uploads/")) {
    return NextResponse.json({ embedUrl: "", finalUrl: originalUrl });
  }

  const directEmbed = getEmbeddableVideoUrl(originalUrl);
  if (directEmbed) {
    return NextResponse.json({ embedUrl: directEmbed, finalUrl: originalUrl });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(originalUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timeout);

    const finalUrl = response.url || originalUrl;
    return NextResponse.json({
      embedUrl: getEmbeddableVideoUrl(finalUrl),
      finalUrl
    });
  } catch {
    return NextResponse.json({ embedUrl: "", finalUrl: originalUrl });
  }
}
