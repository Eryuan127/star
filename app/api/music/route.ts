import { NextResponse } from "next/server";
import { databaseMissingResponse, hasDatabase, requireText } from "@/lib/cms";
import { musicTracks } from "@/lib/data";
import { prisma } from "@/lib/prisma";

function clampSortOrder(value: unknown) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(-10000, Math.min(10000, Math.trunc(parsed)));
}

function extractJsonp(text: string) {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) return trimmed;
  return trimmed.slice(start, end + 1);
}

function extractQqPlaylistId(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return raw;

  try {
    const parsed = new URL(raw);
    const pathId = parsed.pathname.match(/(?:playlist|playsquare|taoge|details\/taoge)\D*(\d+)/i)?.[1];
    return (
      parsed.searchParams.get("id") ??
      parsed.searchParams.get("dirid") ??
      parsed.searchParams.get("disstid") ??
      pathId ??
      ""
    );
  } catch {
    return raw.match(/(?:id|dirid|disstid|playlist)[=/](\d+)/i)?.[1] ?? "";
  }
}

type QqSong = {
  id?: number | string;
  interval?: number | string;
  songid?: number | string;
  songmid?: string;
  mid?: string;
  songname?: string;
  name?: string;
  singer?: Array<{ name?: string }>;
};

async function fetchQqPlaylist(playlistId: string) {
  const endpoint = new URL("https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg");
  endpoint.search = new URLSearchParams({
    type: "1",
    json: "1",
    utf8: "1",
    onlysong: "0",
    disstid: playlistId,
    format: "json",
    g_tk: "5381",
    loginUin: "0",
    hostUin: "0",
    inCharset: "utf8",
    outCharset: "utf-8",
    notice: "0",
    platform: "yqq.json",
    needNewCode: "0"
  }).toString();

  const response = await fetch(endpoint, {
    headers: {
      Referer: "https://y.qq.com/",
      "User-Agent": "Mozilla/5.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("QQ playlist request failed");
  }

  const data = JSON.parse(extractJsonp(await response.text()));
  const playlist = data?.cdlist?.[0];
  const songs = Array.isArray(playlist?.songlist) ? playlist.songlist as QqSong[] : [];

  return {
    title: String(playlist?.dissname ?? "QQ Music playlist"),
    songs: songs
      .map((song) => {
        const songMid = song.songmid ?? song.mid ?? "";
        const songId = song.songid ?? song.id ?? "";
        return {
          artist: song.singer?.map((item) => item.name).filter(Boolean).join(" / ") || "QQ Music",
          title: song.songname ?? song.name ?? "Untitled song",
          audioUrl: songId ? `https://i.y.qq.com/v8/playsong.html?songid=${songId}&duration=${Number(song.interval ?? 0) || 0}` : "",
          oldAudioUrl: songId ? `https://i.y.qq.com/v8/playsong.html?songid=${songId}` : "",
          legacyAudioUrl: songMid ? `https://y.qq.com/n/ryqq/songDetail/${songMid}` : ""
        };
      })
      .filter((song) => song.audioUrl)
  };
}

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ source: "fallback", musicTracks });
  }

  const tracks = await prisma.musicTrack.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ source: "mysql", musicTracks: tracks });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  try {
    const body = await request.json();
    if (body.importSource === "qq-playlist") {
      const playlistId = extractQqPlaylistId(body.playlistUrl);
      if (!playlistId) {
        return NextResponse.json({ message: "没有识别到 QQ 音乐歌单 ID，请粘贴完整歌单链接。" }, { status: 400 });
      }

      const playlist = await fetchQqPlaylist(playlistId);
      if (!playlist.songs.length) {
        return NextResponse.json({ message: "这个 QQ 音乐歌单暂时没有识别到歌曲，可能是私密歌单或 QQ 音乐限制了访问。" }, { status: 400 });
      }

      const importedUrls = playlist.songs.flatMap((song) => [song.audioUrl, song.oldAudioUrl, song.legacyAudioUrl]).filter(Boolean);
      const existing = await prisma.musicTrack.findMany({
        where: { audioUrl: { in: importedUrls } },
        select: { id: true, audioUrl: true }
      });
      const existingByUrl = new Map<string, string>();
      for (const track of existing) {
        if (track.audioUrl) existingByUrl.set(track.audioUrl, track.id);
      }
      const latest = await prisma.musicTrack.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
      let sortOrder = (latest?.sortOrder ?? 0) + 1;
      let importedCount = 0;
      let updatedCount = 0;

      for (const song of playlist.songs) {
        if (existingByUrl.has(song.audioUrl)) continue;
        const oldId = (song.oldAudioUrl ? existingByUrl.get(song.oldAudioUrl) : null) ?? (song.legacyAudioUrl ? existingByUrl.get(song.legacyAudioUrl) : null);
        if (oldId) {
          await prisma.musicTrack.update({
            where: { id: oldId },
            data: {
              artist: song.artist,
              title: song.title,
              mood: playlist.title,
              accent: "#31C27C",
              audioUrl: song.audioUrl
            }
          });
          existingByUrl.set(song.audioUrl, oldId);
          updatedCount += 1;
          continue;
        }
        await prisma.musicTrack.create({
          data: {
            artist: song.artist,
            title: song.title,
            mood: playlist.title,
            accent: "#31C27C",
            audioUrl: song.audioUrl,
            sortOrder
          }
        });
        sortOrder += 1;
        importedCount += 1;
      }

      return NextResponse.json({
        importedCount,
        updatedCount,
        skippedCount: playlist.songs.length - importedCount - updatedCount,
        playlistTitle: playlist.title
      }, { status: 201 });
    }

    const track = await prisma.musicTrack.create({
      data: {
        artist: String(body.artist ?? ""),
        title: String(body.title ?? ""),
        mood: String(body.mood ?? ""),
        accent: String(body.accent ?? "#D97F9F"),
        audioUrl: body.audioUrl ? String(body.audioUrl) : null,
        sortOrder: clampSortOrder(body.sortOrder)
      }
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "歌曲添加失败，请检查链接或稍后再试。" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasDatabase()) {
    return databaseMissingResponse();
  }

  const { searchParams } = new URL(request.url);
  let ids = searchParams
    .getAll("id")
    .flatMap((value) => value.split(","))
    .map((value) => requireText(value))
    .filter(Boolean);

  if (!ids.length) {
    try {
      const body = await request.json() as { id?: unknown; ids?: unknown[] };
      ids = (Array.isArray(body.ids) ? body.ids : [body.id])
        .map((value) => requireText(value))
        .filter(Boolean);
    } catch {
      ids = [];
    }
  }

  if (!ids.length) {
    return NextResponse.json({ message: "缺少要删除的歌曲 ID。" }, { status: 400 });
  }

  const result = await prisma.musicTrack.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ ok: true, deletedCount: result.count });
}
