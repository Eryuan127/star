"use client";

import { type CSSProperties, type ReactNode, FormEvent, useEffect, useId, useMemo, useState } from "react";
import {
  CalendarDays,
  Database,
  Heart,
  Link,
  LogIn,
  Mic2,
  Pause,
  PencilLine,
  Play,
  Plus,
  Radio,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UploadCloud,
  UserPlus,
  Video,
  X
} from "lucide-react";
import {
  musicTracks,
  navItems,
  notes,
  offlineEntries,
  onlineEntries,
  scheduleItems,
  skills,
  stats,
  videoPick
} from "@/lib/data";

type PageId = (typeof navItems)[number]["id"];
type EntryType = "OFFLINE" | "ONLINE" | "NOTE";

type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "USER" | string;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  bio?: string | null;
  profileSections?: string | null;
};

type CmsEntry = {
  id: string;
  type: string;
  title: string;
  dateText?: string;
  date?: string;
  location?: string | null;
  artist?: string | null;
  summary: string;
  highlight?: string | null;
  mediaUrl?: string | null;
  tags?: Array<string | { name: string }>;
  author?: { id: string; displayName: string; username: string } | null;
};

type CmsSchedule = {
  id?: string;
  dateText?: string;
  date?: string;
  artist: string;
  title: string;
  status: string;
  note?: string | null;
  linkUrl?: string | null;
};

type CmsTrack = {
  id: string;
  artist: string;
  title: string;
  mood: string;
  accent: string;
  audioUrl?: string | null;
};

type CmsGoal = {
  id?: string;
  title: string;
  detail: string;
  progress: number;
  status?: string;
  dueText?: string | null;
};

type CmsAchievement = {
  id: string;
  title: string;
  detail: string;
  dateText?: string | null;
};

type CmsSkill = {
  id?: string;
  name: string;
  level: string;
  copy: string;
  artist?: string | null;
  mediaUrl?: string | null;
  sortOrder?: number;
  achievements?: CmsAchievement[];
};

type CmsVideo = {
  id?: string;
  title: string;
  artist: string;
  publishDate: string;
  reason: string;
  note: string;
  videoUrl?: string | null;
  coverUrl?: string | null;
};

type CmsPayload = {
  source?: string;
  video?: CmsVideo | null;
  schedules?: CmsSchedule[];
  musicTracks?: CmsTrack[];
  entries?: CmsEntry[];
  goals?: CmsGoal[];
  skills?: CmsSkill[];
};

type EntryDraft = {
  id?: string;
  type: EntryType;
  title: string;
  dateText: string;
  location: string;
  artist: string;
  summary: string;
  highlight: string;
  tags: string;
  mediaUrl: string;
};

type ScheduleDraft = Required<Pick<CmsSchedule, "artist" | "title" | "status">> & {
  id?: string;
  dateText: string;
  note: string;
  linkUrl: string;
};

type GoalDraft = {
  id?: string;
  title: string;
  detail: string;
  progress: string;
  status: string;
  dueText: string;
};

type AchievementDraft = {
  skillId: string;
  skillName: string;
  title: string;
  detail: string;
  dateText: string;
};

type SkillDraft = {
  id?: string;
  name: string;
  level: string;
  copy: string;
  artist: string;
  mediaUrl: string;
  sortOrder: string;
};

type VideoDraft = {
  title: string;
  artist: string;
  publishDate: string;
  reason: string;
  note: string;
  videoUrl: string;
  coverUrl: string;
};

type MusicDraft = {
  artist: string;
  title: string;
  mood: string;
  accent: string;
  audioUrl: string;
};

type AppSettings = {
  backgroundVideoUrl: string;
  musicFloating: boolean;
};


const emptyEntryDraft: EntryDraft = {
  type: "OFFLINE",
  title: "",
  dateText: "",
  location: "",
  artist: "",
  summary: "",
  highlight: "",
  tags: "",
  mediaUrl: ""
};

const emptyScheduleDraft: ScheduleDraft = {
  dateText: "",
  artist: "",
  title: "",
  status: "PLANNED",
  note: "",
  linkUrl: ""
};

const emptyGoalDraft: GoalDraft = {
  title: "",
  detail: "",
  progress: "0",
  status: "IN_PROGRESS",
  dueText: ""
};

const emptySkillDraft: SkillDraft = {
  name: "",
  level: "",
  copy: "",
  artist: "",
  mediaUrl: "",
  sortOrder: "0"
};

const defaultSettings: AppSettings = {
  backgroundVideoUrl: "",
  musicFloating: true
};

const emptyVideoDraft: VideoDraft = {
  title: "",
  artist: "",
  publishDate: "",
  reason: "",
  note: "",
  videoUrl: "",
  coverUrl: ""
};

const emptyMusicDraft: MusicDraft = {
  artist: "",
  title: "",
  mood: "",
  accent: "#D97F9F",
  audioUrl: ""
};

const pageTitles: Record<PageId, { title: string; copy: string }> = {
  home: {
    title: "我的追星日记",
    copy: "把现场、视频、歌单、行程和小技能都收进一个不拥挤的私人工作台。"
  },
  offline: {
    title: "线下日记",
    copy: "记录真实去过的地点、路线、入场经验和下次想提醒自己的细节。"
  },
  online: {
    title: "线上日记",
    copy: "保存数据复盘、好看的物料、被翻牌的瞬间和产出心得。"
  },
  goals: {
    title: "小目标",
    copy: "先从空白开始，把想做的企划慢慢加进来。"
  },
  skills: {
    title: "追星技能",
    copy: "点击技能板块，记录你之前习得的成就和作品。"
  },
  notes: {
    title: "碎碎念",
    copy: "不需要很正式，只要把被治愈、被击中、被点亮的瞬间留下。"
  }
};

const categoryLabels: Record<EntryType, string> = {
  OFFLINE: "线下日记",
  ONLINE: "线上日记",
  NOTE: "碎碎念"
};

function pageToEntryType(page: PageId): EntryType {
  if (page === "online") return "ONLINE";
  if (page === "notes") return "NOTE";
  return "OFFLINE";
}

function normalizeTags(tags: CmsEntry["tags"]) {
  return Array.isArray(tags)
    ? tags.map((tag) => (typeof tag === "string" ? tag : tag.name)).filter(Boolean)
    : [];
}

function isVideoSource(url?: string | null) {
  return Boolean(url && /\.(mp4|mov|webm)(\?.*)?$/i.test(url));
}

function isImageSource(url?: string | null) {
  return Boolean(url && /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url));
}

function normalizeExternalUrl(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/uploads/")) return trimmed;
  if (/^(www\.|m\.|b23\.|bilibili\.|youtube\.|youtu\.be)/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function buildBilibiliEmbed(url?: string | null, autoplay = false) {
  const normalized = normalizeExternalUrl(url);
  const bvid = normalized.match(/BV[0-9A-Za-z]+/i)?.[0];
  if (bvid) {
    return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&autoplay=${autoplay ? 1 : 0}&muted=1&high_quality=1`;
  }
  const aid = normalized.match(/(?:\/video\/av|[?&]aid=|av)(\d+)/i)?.[1];
  if (aid) {
    return `https://player.bilibili.com/player.html?aid=${aid}&page=1&autoplay=${autoplay ? 1 : 0}&muted=1&high_quality=1`;
  }
  return "";
}

function getEmbeddableVideoUrl(url?: string | null, autoplay = false) {
  const normalized = normalizeExternalUrl(url);
  if (!normalized) return "";

  const bilibiliEmbed = buildBilibiliEmbed(normalized, autoplay);
  if (bilibiliEmbed) return bilibiliEmbed;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&mute=1&loop=1&playlist=${id}&playsinline=1&rel=0` : "";
    }

    if (host.includes("youtube.com")) {
      const id = parsed.searchParams.get("v") ?? parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1] ?? parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&mute=1&loop=1&playlist=${id}&playsinline=1&rel=0` : "";
    }
  } catch {
    return "";
  }
  return "";
}

function getMusicPlaylistEmbedUrl(url?: string | null) {
  const normalized = normalizeExternalUrl(url);
  if (!normalized) return "";

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host.includes("music.163.com") || host.includes("163cn.tv")) {
      const playlistId = parsed.searchParams.get("id") ?? parsed.hash.match(/playlist\?id=(\d+)/)?.[1] ?? parsed.pathname.match(/playlist\/(\d+)/)?.[1];
      return playlistId ? `https://music.163.com/outchain/player?type=0&id=${playlistId}&auto=1&height=430` : "";
    }

  if (host.includes("y.qq.com") || host.includes("qq.com")) {
      const songId = parsed.pathname.match(/songDetail\/([^/?]+)/)?.[1] ?? parsed.searchParams.get("songmid") ?? parsed.searchParams.get("songid");
      const playlistId = parsed.pathname.match(/playlist\/(\d+)/)?.[1] ?? parsed.searchParams.get("id") ?? parsed.searchParams.get("dirid") ?? parsed.searchParams.get("disstid");
      if (songId) return `https://i.y.qq.com/n2/m/outchain/player/index.html?songmid=${songId}`;
      if (playlistId) return `https://i.y.qq.com/n2/m/outchain/player/index.html?songlist=${playlistId}`;
    }
  } catch {
    return "";
  }

  return "";
}

function isAudioSource(url?: string | null) {
  return Boolean(url && /\.(mp3|m4a|ogg|wav|webm)(\?.*)?$/i.test(url));
}

function guessTrackMetaFromUrl(url: string) {
  const clean = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "").replace(/\.[^.]+$/, "");
  const [artist, title] = clean.includes(" - ") ? clean.split(" - ", 2) : ["", clean];
  return {
    artist: artist.trim(),
    title: title.trim()
  };
}

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function videoDraftFromVideo(video: CmsVideo): VideoDraft {
  return {
    title: video.title,
    artist: video.artist,
    publishDate: video.publishDate,
    reason: video.reason,
    note: video.note,
    videoUrl: video.videoUrl ?? "",
    coverUrl: video.coverUrl ?? ""
  };
}

function draftFromEntry(entry: CmsEntry): EntryDraft {
  return {
    id: entry.id,
    type: String(entry.type).toUpperCase() as EntryType,
    title: entry.title,
    dateText: entry.dateText ?? entry.date ?? "",
    location: entry.location ?? "",
    artist: entry.artist ?? "",
    summary: entry.summary,
    highlight: entry.highlight ?? "",
    tags: normalizeTags(entry.tags).join(", "),
    mediaUrl: entry.mediaUrl ?? ""
  };
}

function draftFromSchedule(schedule: CmsSchedule): ScheduleDraft {
  return {
    id: schedule.id,
    dateText: schedule.dateText ?? schedule.date ?? "",
    artist: schedule.artist,
    title: schedule.title,
    status: schedule.status,
    note: schedule.note ?? "",
    linkUrl: schedule.linkUrl ?? ""
  };
}

function draftFromGoal(goal: CmsGoal): GoalDraft {
  return {
    id: goal.id,
    title: goal.title,
    detail: goal.detail,
    progress: String(goal.progress ?? 0),
    status: goal.status ?? "IN_PROGRESS",
    dueText: goal.dueText ?? ""
  };
}

function draftFromSkill(skill: CmsSkill): SkillDraft {
  return {
    id: skill.id,
    name: skill.name,
    level: skill.level,
    copy: skill.copy,
    artist: skill.artist ?? "",
    mediaUrl: skill.mediaUrl ?? "",
    sortOrder: String(skill.sortOrder ?? 0)
  };
}

export function DiaryDesk() {
  const [activePage, setActivePage] = useState<PageId>("home");
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cmsData, setCmsData] = useState<CmsPayload | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [entryDraft, setEntryDraft] = useState<EntryDraft | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft | null>(null);
  const [videoDraft, setVideoDraft] = useState<VideoDraft | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CmsEntry | null>(null);
  const [goalDraft, setGoalDraft] = useState<GoalDraft | null>(null);
  const [achievementDraft, setAchievementDraft] = useState<AchievementDraft | null>(null);
  const [skillDraft, setSkillDraft] = useState<SkillDraft | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleListOpen, setScheduleListOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [authOpen, setAuthOpen] = useState(false);
  const [status, setStatus] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";

  async function refreshCms() {
    try {
      const response = await fetch("/api/cms", { cache: "no-store" });
      setCmsData((await response.json()) as CmsPayload);
    } catch {
      setCmsData(null);
    }
  }

  useEffect(() => {
    refreshCms();
    const storedUser = window.localStorage.getItem("idol-diary-user");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    const storedSettings = window.localStorage.getItem("idol-diary-settings");
    if (storedSettings) setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
  }, []);

  function saveSettings(nextSettings: AppSettings) {
    setSettings(nextSettings);
    window.localStorage.setItem("idol-diary-settings", JSON.stringify(nextSettings));
    setSettingsOpen(false);
    setStatus("设置已保存。");
  }

  function updateUser(user: CurrentUser | null) {
    setCurrentUser(user);
    if (user) {
      window.localStorage.setItem("idol-diary-user", JSON.stringify(user));
    } else {
      window.localStorage.removeItem("idol-diary-user");
    }
  }

  function openNewEntry(type = pageToEntryType(activePage)) {
    setEntryDraft({ ...emptyEntryDraft, type, dateText: new Date().toLocaleDateString("zh-CN") });
    setStatus("");
  }

  async function saveEntry(draft: EntryDraft) {
    setStatus("正在保存文档...");
    const response = await fetch("/api/entries", {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, authorId: currentUser?.id })
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "保存失败。");
      return;
    }
    setEntryDraft(null);
    setStatus("文档已保存。");
    await refreshCms();
  }

  async function deleteEntry(entry: CmsEntry) {
    if (!isAdmin) {
      setStatus("只有管理员可以删除文档。");
      return;
    }
    if (!window.confirm(`删除《${entry.title}》吗？`)) return;
    const response = await fetch(`/api/entries?id=${encodeURIComponent(entry.id)}&requesterId=${encodeURIComponent(currentUser?.id ?? "")}`, {
      method: "DELETE"
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "删除失败。");
      return;
    }
    setStatus("文档已删除。");
    await refreshCms();
  }

  async function saveSchedule(draft: ScheduleDraft) {
    const response = await fetch("/api/schedules", {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "行程保存失败。");
      return;
    }
    setScheduleDraft(null);
    setStatus("行程已保存。");
    await refreshCms();
  }

  async function deleteSchedule(draft: ScheduleDraft) {
    if (!draft.id) {
      setScheduleDraft(null);
      return;
    }
    if (!window.confirm(`删除行程“${draft.title}”吗？`)) return;
    const response = await fetch(`/api/schedules?id=${encodeURIComponent(draft.id)}`, {
      method: "DELETE"
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "行程删除失败。");
      return;
    }
    setScheduleDraft(null);
    setStatus("行程已删除。");
    await refreshCms();
  }

  async function saveVideo(draft: VideoDraft) {
    const response = await fetch("/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "顶部视频保存失败。");
      return;
    }
    setVideoDraft(null);
    setStatus("顶部视频已更新。");
    await refreshCms();
  }

  async function saveMusicTrack(draft: MusicDraft) {
    const response = await fetch("/api/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist: draft.artist || "未知歌手",
        title: draft.title || "未命名歌曲",
        mood: draft.mood || "自定义播放",
        accent: draft.accent || "#D97F9F",
        audioUrl: draft.audioUrl,
        sortOrder: -9999
      })
    });
    const result = await readJsonSafely(response) as { message?: string };
    if (!response.ok) {
      setStatus(result.message ?? "歌曲添加失败。");
      return;
    }
    setStatus("歌曲已添加。");
    await refreshCms();
    setActiveTrackIndex(0);
  }

  async function deleteMusicTrack(track: CmsTrack) {
    if (!track.id || track.id.startsWith("fallback-")) return;
    if (!window.confirm(`删除歌曲“${track.title}”吗？`)) return;
    const response = await fetch(`/api/music?id=${encodeURIComponent(track.id)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "歌曲删除失败。");
      return;
    }
    setStatus("歌曲已删除。");
    setActiveTrackIndex(0);
    await refreshCms();
  }

  async function saveGoal(draft: GoalDraft) {
    const response = await fetch("/api/goals", {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "目标保存失败。");
      return;
    }
    setGoalDraft(null);
    setStatus("目标已保存。");
    await refreshCms();
  }

  async function saveAchievement(draft: AchievementDraft) {
    const response = await fetch("/api/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "成就保存失败。");
      return;
    }
    setAchievementDraft(null);
    setStatus("成就已保存。");
    await refreshCms();
  }

  async function saveSkill(draft: SkillDraft) {
    const response = await fetch("/api/skills", {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "技能保存失败。");
      return;
    }
    setSkillDraft(null);
    setStatus("技能板块已保存。");
    await refreshCms();
  }

  const displayVideo: CmsVideo = cmsData?.video ?? videoPick;
  const displaySchedules = cmsData?.schedules?.length ? cmsData.schedules : scheduleItems;
  const displayTracks = cmsData?.musicTracks?.length ? cmsData.musicTracks : musicTracks;
  const displayEntries = cmsData?.entries?.length ? cmsData.entries : [...offlineEntries, ...onlineEntries];
  const displayGoals = cmsData?.goals ?? [];
  const displaySkills = cmsData?.skills?.length ? cmsData.skills : skills.map((skill, index) => ({
    ...skill,
    id: `fallback-${index}`,
    achievements: []
  }));
  const displayOfflineEntries = displayEntries.filter((entry) => String(entry.type).toUpperCase() === "OFFLINE");
  const displayOnlineEntries = displayEntries.filter((entry) => String(entry.type).toUpperCase() === "ONLINE");
  const displayNoteEntries = displayEntries.filter((entry) => String(entry.type).toUpperCase() === "NOTE");
  const activeTrack = displayTracks[activeTrackIndex % displayTracks.length] ?? musicTracks[0];
  const pageMeta = pageTitles[activePage];

  const pageContent = useMemo(() => {
    if (activePage === "home") {
      return <HomePanel entries={displayEntries} onNewEntry={openNewEntry} />;
    }
    if (activePage === "offline") {
      return (
        <EntryPanel
          canDelete={isAdmin}
          emptyText="还没有线下文档，先写一次现场记录。"
          entries={displayOfflineEntries}
          onDelete={deleteEntry}
          onEdit={(entry) => setEntryDraft(draftFromEntry(entry))}
          onNew={() => openNewEntry("OFFLINE")}
          onOpen={setSelectedEntry}
          variant="offline"
        />
      );
    }
    if (activePage === "online") {
      return (
        <EntryPanel
          canDelete={isAdmin}
          emptyText="还没有线上文档，把数据复盘、物料收藏或灵感先存进来。"
          entries={displayOnlineEntries}
          onDelete={deleteEntry}
          onEdit={(entry) => setEntryDraft(draftFromEntry(entry))}
          onNew={() => openNewEntry("ONLINE")}
          onOpen={setSelectedEntry}
          variant="online"
        />
      );
    }
    if (activePage === "goals") {
      return <GoalsPanel rows={displayGoals} onEdit={(goal) => setGoalDraft(draftFromGoal(goal))} onNew={() => setGoalDraft(emptyGoalDraft)} />;
    }
    if (activePage === "skills") {
      return (
        <SkillsPanel
          rows={displaySkills}
          onEdit={(skill) => setSkillDraft(draftFromSkill(skill))}
          onAchievement={(skill) => {
            if (!skill.id || skill.id.startsWith("fallback-")) {
              setStatus("请先在数据库中添加一个技能板块，再记录成就。");
              return;
            }
            setAchievementDraft({
              skillId: skill.id,
              skillName: skill.name,
              title: "",
              detail: "",
              dateText: new Date().toLocaleDateString("zh-CN")
            });
          }}
        />
      );
    }
    return (
      <NotesPanel
        canDelete={isAdmin}
        entries={displayNoteEntries}
        onDelete={deleteEntry}
        onEdit={(entry) => setEntryDraft(draftFromEntry(entry))}
        onNew={() => openNewEntry("NOTE")}
        onOpen={setSelectedEntry}
      />
    );
  }, [activePage, displayEntries, displayGoals, displayNoteEntries, displayOfflineEntries, displayOnlineEntries, displaySkills, isAdmin]);

  return (
    <main className="desk-app">
      <BackgroundVideo source={settings.backgroundVideoUrl} />
      <div className="motion-bg" aria-hidden="true"><span /><span /><span /></div>

      <header className="top-brand">
        <a className="desk-brand" href="#">
          <span><Heart size={18} /></span>
          <strong>追星日记</strong>
        </a>
        <div className="header-actions">
          <button onClick={() => openNewEntry()} type="button"><PencilLine size={17} />写一条</button>
          <button onClick={() => currentUser ? window.location.assign("/profile") : setAuthOpen(true)} type="button">
            {currentUser ? <ShieldCheck size={17} /> : <LogIn size={17} />}
            {currentUser ? `${currentUser.displayName}${isAdmin ? " · 管理员" : ""}` : "登录"}
          </button>
          <button onClick={() => setSettingsOpen(true)} type="button"><SlidersHorizontal size={17} />设置</button>
          {isAdmin ? <a className="pill-link" href="/admin"><Database size={17} />数据库</a> : null}
        </div>
      </header>

      {status ? <div className="desk-status">{status}</div> : null}

      <section className="video-command" aria-label="视频与艺人行程">
        <div className="video-copy">
          <span className="eyebrow">Favorite Video</span>
          <h1 onClick={() => setVideoDraft(videoDraftFromVideo(displayVideo))}>{displayVideo.title}</h1>
          <p onClick={() => setVideoDraft(videoDraftFromVideo(displayVideo))}>{displayVideo.reason}</p>
          <div className="video-facts">
            <button onClick={() => setVideoDraft(videoDraftFromVideo(displayVideo))} type="button">{displayVideo.publishDate}</button>
            <button onClick={() => setVideoDraft(videoDraftFromVideo(displayVideo))} type="button">{displayVideo.artist}</button>
          </div>
        </div>
        <div className="video-frame">
          <div className="video-screen" onClick={() => setVideoDraft(videoDraftFromVideo(displayVideo))}>
            <VideoSpotlightMedia video={displayVideo} />
          </div>
          <div className="video-control-strip"><span /><span /><span /></div>
        </div>
        <ScheduleTimeline
          schedules={displaySchedules}
          onEdit={(schedule) => setScheduleDraft(draftFromSchedule(schedule))}
          onNew={() => setScheduleDraft({ ...emptyScheduleDraft, dateText: new Date().toLocaleDateString("zh-CN") })}
          onViewAll={() => setScheduleListOpen(true)}
        />
      </section>

      <section className="workspace">
        <aside className="page-nav" aria-label="页面导航">
          <nav>
            {navItems.map(({ id, label, Icon }) => (
              <button className={activePage === id ? "active" : ""} key={id} onClick={() => setActivePage(id)} type="button">
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="side-note"><Sparkles size={16} /><span>普通用户可以写文档、改行程、加目标和记录技能成就；数据库入口只对管理员显示。</span></div>
        </aside>

        <section className={`page-panel page-${activePage}`} aria-live="polite">
          <div className="page-heading with-action">
            <div><span className="eyebrow">Personal Idol Desk</span><h2>{pageMeta.title}</h2><p>{pageMeta.copy}</p></div>
            {["offline", "online", "notes"].includes(activePage) ? (
              <button className="panel-new-button" onClick={() => openNewEntry(pageToEntryType(activePage))} type="button"><Plus size={17} />新文档</button>
            ) : activePage === "goals" ? (
              <button className="panel-new-button" onClick={() => setGoalDraft(emptyGoalDraft)} type="button"><Plus size={17} />新目标</button>
            ) : activePage === "skills" ? (
              <button className="panel-new-button" onClick={() => setSkillDraft(emptySkillDraft)} type="button"><Plus size={17} />新技能</button>
            ) : null}
          </div>
          {pageContent}
        </section>
      </section>

      <MiniMusicDock
        activeTrack={activeTrack}
        isFloating={settings.musicFloating}
        isPlaying={isPlaying}
        onNext={() => setActiveTrackIndex((index) => (index + 1) % displayTracks.length)}
        onToggle={() => setIsPlaying((value) => !value)}
      />

      {entryDraft ? <EntryModal draft={entryDraft} isLoggedIn={Boolean(currentUser)} onClose={() => setEntryDraft(null)} onLogin={() => setAuthOpen(true)} onSave={saveEntry} onUpdate={setEntryDraft} /> : null}
      {videoDraft ? <VideoModal draft={videoDraft} onClose={() => setVideoDraft(null)} onSave={saveVideo} onUpdate={setVideoDraft} /> : null}
      {selectedEntry ? <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} /> : null}
      {scheduleDraft ? <ScheduleModal draft={scheduleDraft} onClose={() => setScheduleDraft(null)} onDelete={deleteSchedule} onSave={saveSchedule} onUpdate={setScheduleDraft} /> : null}
      {goalDraft ? <GoalModal draft={goalDraft} onClose={() => setGoalDraft(null)} onSave={saveGoal} onUpdate={setGoalDraft} /> : null}
      {achievementDraft ? <AchievementModal draft={achievementDraft} onClose={() => setAchievementDraft(null)} onSave={saveAchievement} onUpdate={setAchievementDraft} /> : null}
      {skillDraft ? <SkillModal draft={skillDraft} onClose={() => setSkillDraft(null)} onSave={saveSkill} onUpdate={setSkillDraft} /> : null}
      {settingsOpen ? <SettingsModal activeTrack={activeTrack} onDeleteTrack={deleteMusicTrack} onSaveMusic={saveMusicTrack} settings={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} /> : null}
      {scheduleListOpen ? (
        <ScheduleListModal schedules={displaySchedules} onClose={() => setScheduleListOpen(false)} onEdit={(schedule) => { setScheduleListOpen(false); setScheduleDraft(draftFromSchedule(schedule)); }} />
      ) : null}
      {authOpen ? <AuthModal currentUser={currentUser} onClose={() => setAuthOpen(false)} onStatus={setStatus} onUser={(user) => { updateUser(user); setAuthOpen(false); }} /> : null}
    </main>
  );
}

function BackgroundVideo({ source }: { source: string }) {
  const normalizedSource = normalizeExternalUrl(source);
  const embedUrl = getEmbeddableVideoUrl(normalizedSource, true);
  if (!source) return null;
  if (isVideoSource(normalizedSource)) {
    return <video className="kpop-bg-video" src={normalizedSource} autoPlay muted loop playsInline />;
  }
  if (embedUrl) {
    return <iframe className="kpop-bg-video embed" src={embedUrl} title="背景视频" allow="autoplay; encrypted-media; picture-in-picture" />;
  }
  return <ResolvedEmbedFrame autoplay className="kpop-bg-video embed" source={normalizedSource} title="背景视频" />;
}

function VideoSpotlightMedia({ video }: { video: CmsVideo }) {
  const normalizedSource = normalizeExternalUrl(video.videoUrl);
  const embedUrl = getEmbeddableVideoUrl(normalizedSource, true);
  if (normalizedSource && isVideoSource(normalizedSource)) {
    return <video autoPlay controls loop muted playsInline poster={video.coverUrl ?? undefined} src={normalizedSource} />;
  }
  if (embedUrl) {
    return <iframe src={embedUrl} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  }
  if (normalizedSource) {
    return <ResolvedEmbedFrame autoplay source={normalizedSource} title={video.title} />;
  }
  if (video.coverUrl) {
    return <img alt={video.title} src={video.coverUrl} />;
  }
  return (
    <>
      <Video size={50} />
      <strong>Favorite Stage Video</strong>
      <span>在这里放你最喜欢的艺人视频链接或封面</span>
    </>
  );
}

function MediaPreview({ alt, className, source }: { alt: string; className: string; source?: string | null }) {
  const normalizedSource = normalizeExternalUrl(source);
  const embedUrl = getEmbeddableVideoUrl(normalizedSource);
  if (!normalizedSource) return null;
  if (isVideoSource(normalizedSource)) {
    return <div className={className}><video controls src={normalizedSource} /></div>;
  }
  if (isImageSource(normalizedSource) || normalizedSource.startsWith("/uploads/")) {
    return <div className={className}><img alt={alt} src={normalizedSource} /></div>;
  }
  if (embedUrl) {
    return <div className={className}><iframe src={embedUrl} title={alt} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>;
  }
  return <div className={className}><ResolvedEmbedFrame source={normalizedSource} title={alt} fallback={<a className="entry-link-card" href={normalizedSource} onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank"><Link size={15} />打开链接</a>} /></div>;
}

function ResolvedEmbedFrame({ autoplay = false, className, fallback = null, source, title }: { autoplay?: boolean; className?: string; fallback?: ReactNode; source: string; title: string }) {
  const [embedUrl, setEmbedUrl] = useState(getEmbeddableVideoUrl(source, autoplay));
  const normalizedSource = normalizeExternalUrl(source);

  useEffect(() => {
    let ignore = false;
    const directEmbed = getEmbeddableVideoUrl(normalizedSource, autoplay);
    setEmbedUrl(directEmbed);
    if (!normalizedSource || directEmbed || normalizedSource.startsWith("/uploads/")) return;

    fetch(`/api/media/resolve?url=${encodeURIComponent(normalizedSource)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { embedUrl?: string }) => {
        if (!ignore) setEmbedUrl(result.embedUrl ?? "");
      })
      .catch(() => {
        if (!ignore) setEmbedUrl("");
      });

    return () => {
      ignore = true;
    };
  }, [autoplay, normalizedSource]);

  if (!normalizedSource) return null;
  if (!embedUrl) return <>{fallback}</>;
  return <iframe className={className} src={embedUrl} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
}

function ScheduleTimeline({
  schedules,
  onEdit,
  onNew,
  onViewAll
}: {
  schedules: CmsSchedule[];
  onEdit: (schedule: CmsSchedule) => void;
  onNew: () => void;
  onViewAll: () => void;
}) {
  const visibleSchedules = schedules.slice(0, 4);
  return (
    <aside className="schedule-timeline">
      <div className="timeline-title">
        <span className="icon-box"><CalendarDays size={18} /></span>
        <div><span className="eyebrow">Schedule Timeline</span><h2>艺人行程</h2></div>
      </div>
      <div className="timeline-list">
        {visibleSchedules.map((item, index) => (
          <article className="timeline-editable" key={item.id ?? `${item.dateText ?? item.date}-${item.title}-${index}`} onClick={() => onEdit(item)}>
            <time>{item.dateText ?? item.date}</time>
            <div><strong>{item.artist}</strong><span className="timeline-ellipsis">{item.title}</span><small>{item.status}</small></div>
          </article>
        ))}
      </div>
      <div className="schedule-actions">
        <button className="ghost-button" onClick={onViewAll} type="button">查看全部</button>
        <button className="quick-save-button" onClick={onNew} type="button"><Plus size={16} />新增行程</button>
      </div>
    </aside>
  );
}

function HomePanel({ entries, onNewEntry }: { entries: CmsEntry[]; onNewEntry: (type: EntryType) => void }) {
  const counts = {
    OFFLINE: entries.filter((entry) => String(entry.type).toUpperCase() === "OFFLINE").length,
    ONLINE: entries.filter((entry) => String(entry.type).toUpperCase() === "ONLINE").length,
    NOTE: entries.filter((entry) => String(entry.type).toUpperCase() === "NOTE").length
  };
  return (
    <div className="home-panel varied-home">
      <div className="stat-board">
        {stats.map(({ label, value, Icon }, index) => (
          <article className="stat-tile lift-card" key={label}><Icon size={18} /><strong>{index === 0 ? counts.OFFLINE : index === 1 ? counts.ONLINE : index === 2 ? counts.NOTE : value}</strong><span>{label}</span></article>
        ))}
      </div>
      <article className="quote-panel">
        <Mic2 size={24} />
        <h3>追星不是逃离生活，是给生活多装一盏很漂亮的灯。</h3>
        <p>现在可以真正写东西了：选择分类、保存到数据库，再回来慢慢修改。</p>
        <div className="quote-actions">
          <button onClick={() => onNewEntry("OFFLINE")} type="button">写线下</button>
          <button onClick={() => onNewEntry("ONLINE")} type="button">写线上</button>
          <button onClick={() => onNewEntry("NOTE")} type="button">写碎碎念</button>
        </div>
      </article>
    </div>
  );
}

function EntryPanel({ canDelete, emptyText, entries, onDelete, onEdit, onNew, onOpen, variant }: { canDelete: boolean; emptyText: string; entries: CmsEntry[]; onDelete: (entry: CmsEntry) => void; onEdit: (entry: CmsEntry) => void; onNew: () => void; onOpen: (entry: CmsEntry) => void; variant: "offline" | "online" }) {
  if (!entries.length) return <EmptyState text={emptyText} onNew={onNew} />;
  return (
    <div className={variant === "offline" ? "offline-layout" : "online-layout"}>
      {entries.map((entry, index) => (
        <article className={variant === "offline" && index === 0 ? "desk-card large feature lift-card" : variant === "online" ? "online-strip lift-card" : "desk-card lift-card"} key={entry.id} onClick={() => onOpen(entry)}>
          <EntryBody canDelete={canDelete} entry={entry} onDelete={onDelete} onEdit={onEdit} />
        </article>
      ))}
    </div>
  );
}

function GoalsPanel({ rows, onEdit, onNew }: { rows: CmsGoal[]; onEdit: (goal: CmsGoal) => void; onNew: () => void }) {
  if (!rows.length) return <EmptyState text="这里先保持空白。添加一个目标后，它会出现在这里。" onNew={onNew} />;
  return (
    <div className="goal-lanes">
      {rows.map((goal, index) => {
        const Icon = skills[index % skills.length]?.Icon ?? Sparkles;
        return (
          <article className="goal-lane lift-card" key={goal.id ?? goal.title} onClick={() => onEdit(goal)}>
            <span className="icon-box"><Icon size={18} /></span>
            <div>
              <div className="card-topline"><h3>{goal.title}</h3><strong>{goal.progress}%</strong></div>
              <p>{goal.detail}</p>
              <div className="progress-track" aria-label={`${goal.title} 进度 ${goal.progress}%`}><span style={{ width: `${goal.progress}%` }} /></div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SkillsPanel({ rows, onAchievement, onEdit }: { rows: CmsSkill[]; onAchievement: (skill: CmsSkill) => void; onEdit: (skill: CmsSkill) => void }) {
  return (
    <div className="skill-mosaic">
      {rows.map((skill, index) => {
        const Icon = skills[index % skills.length]?.Icon ?? Sparkles;
        return (
          <article className="skill-card-desk lift-card" key={skill.id ?? skill.name} onClick={() => onAchievement(skill)}>
            <span className="icon-box"><Icon size={20} /></span>
            <div>
              <div className="card-topline">
                <small>{skill.level}</small>
                <button className="inline-edit-button" onClick={(event) => { event.stopPropagation(); onEdit(skill); }} type="button">修改</button>
              </div>
              <h3>{skill.name}</h3>
              <p>{skill.copy}</p>
              {skill.achievements?.length ? <div className="tag-row">{skill.achievements.slice(0, 3).map((item) => <span key={item.id}>{item.title}</span>)}</div> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SkillModal({ draft, onClose, onSave, onUpdate }: { draft: SkillDraft; onClose: () => void; onSave: (draft: SkillDraft) => void; onUpdate: (draft: SkillDraft) => void }) {
  function updateField(field: keyof SkillDraft, value: string) {
    onUpdate({ ...draft, [field]: value });
  }
  return (
    <ModalFrame eyebrow="Skill" title={draft.id ? "修改技能" : "添加技能"} onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="writer-grid">
          <TextInput required label="技能名称" value={draft.name} onChange={(value) => updateField("name", value)} placeholder="例如：视频剪辑" />
          <TextInput required label="熟练度" value={draft.level} onChange={(value) => updateField("level", value)} placeholder="持续产出" />
          <TextareaInput required wide label="技能说明" value={draft.copy} onChange={(value) => updateField("copy", value)} placeholder="先用通用说明，后续你可以再细化。" />
          <TextInput label="相关艺人" value={draft.artist} onChange={(value) => updateField("artist", value)} placeholder="82MAJOR" />
          <MediaSourceInput
            accept="image/*,video/*"
            label="作品图片/视频"
            onChange={(value) => updateField("mediaUrl", value)}
            value={draft.mediaUrl}
          />
          <TextInput label="排序" value={draft.sortOrder} onChange={(value) => updateField("sortOrder", value)} placeholder="1" />
        </div>
        <SubmitRow onClose={onClose} label="保存技能" />
      </form>
    </ModalFrame>
  );
}

function NotesPanel({ canDelete, entries, onDelete, onEdit, onNew, onOpen }: { canDelete: boolean; entries: CmsEntry[]; onDelete: (entry: CmsEntry) => void; onEdit: (entry: CmsEntry) => void; onNew: () => void; onOpen: (entry: CmsEntry) => void }) {
  const hasEntries = entries.length > 0;
  return (
    <div className="note-board">
      {hasEntries
        ? entries.map((entry) => <article className="note-paper lift-card" key={entry.id} onClick={() => onOpen(entry)}><EntryBody canDelete={canDelete} entry={entry} onDelete={onDelete} onEdit={onEdit} /></article>)
        : notes.map(({ title, body, Icon }) => <article className="note-paper lift-card" key={title}><span className="icon-box sage"><Icon size={18} /></span><h3>{title}</h3><p>{body}</p></article>)}
      {!hasEntries ? <EmptyState compact text="这些是示例碎碎念。点这里写你自己的。" onNew={onNew} /> : null}
    </div>
  );
}

function EmptyState({ compact = false, text, onNew }: { compact?: boolean; text: string; onNew: () => void }) {
  return <article className={compact ? "empty-state compact" : "empty-state"}><Sparkles size={18} /><p>{text}</p><button onClick={onNew} type="button"><Plus size={16} />添加</button></article>;
}

function EntryBody({ canDelete, entry, onDelete, onEdit }: { canDelete: boolean; entry: CmsEntry; onDelete: (entry: CmsEntry) => void; onEdit: (entry: CmsEntry) => void }) {
  const tags = normalizeTags(entry.tags);
  return (
    <>
      <div className="entry-toolbar">
        <div className="entry-meta">
          <span>{categoryLabels[String(entry.type).toUpperCase() as EntryType] ?? "文档"}</span>
          <span>{entry.dateText ?? entry.date}</span>
          {entry.location ? <span>{entry.location}</span> : null}
          {entry.author?.displayName ? <span>{entry.author.displayName}</span> : null}
        </div>
        <div className="entry-actions">
          <button onClick={(event) => { event.stopPropagation(); onEdit(entry); }} title="编辑" type="button"><PencilLine size={15} /></button>
          {canDelete ? <button onClick={(event) => { event.stopPropagation(); onDelete(entry); }} title="删除" type="button"><Trash2 size={15} /></button> : null}
        </div>
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.summary}</p>
      <MediaPreview alt={entry.title} className="entry-media" source={entry.mediaUrl} />
      {tags.length ? <div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
      {entry.highlight ? <div className="highlight"><ShieldCheck size={18} /><span>{entry.highlight}</span></div> : null}
    </>
  );
}

function ModalFrame({ children, onClose, title, eyebrow }: { children: ReactNode; onClose: () => void; title: string; eyebrow: string }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="writer-modal">
        <div className="modal-head">
          <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EntryModal({ draft, isLoggedIn, onClose, onLogin, onSave, onUpdate }: { draft: EntryDraft; isLoggedIn: boolean; onClose: () => void; onLogin: () => void; onSave: (draft: EntryDraft) => void; onUpdate: (draft: EntryDraft) => void }) {
  function updateField(field: keyof EntryDraft, value: string) {
    onUpdate({ ...draft, [field]: value });
  }
  return (
    <ModalFrame eyebrow={draft.id ? "Edit Document" : "New Document"} title={draft.id ? "编辑文档" : "写新文档"} onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        {!isLoggedIn ? <button className="login-nudge" onClick={onLogin} type="button"><LogIn size={16} />登录后会把作者信息一起保存到数据库</button> : null}
        <div className="writer-grid">
          <Field label="分类"><select value={draft.type} onChange={(event) => updateField("type", event.target.value)}><option value="OFFLINE">线下日记</option><option value="ONLINE">线上日记</option><option value="NOTE">碎碎念</option></select></Field>
          <TextInput label="时间" value={draft.dateText} onChange={(value) => updateField("dateText", value)} placeholder="2026.04.20" />
          <TextInput wide required label="标题" value={draft.title} onChange={(value) => updateField("title", value)} placeholder="给这篇文档起个名字" />
          <TextInput label="地点" value={draft.location} onChange={(value) => updateField("location", value)} placeholder="Seoul / Shanghai" />
          <TextInput label="相关艺人" value={draft.artist} onChange={(value) => updateField("artist", value)} placeholder="P1Harmony / TREASURE" />
          <TextareaInput required wide label="正文" value={draft.summary} onChange={(value) => updateField("summary", value)} placeholder="把想写的内容放在这里。" />
          <TextareaInput wide label="高光 / 提醒" value={draft.highlight} onChange={(value) => updateField("highlight", value)} placeholder="最想记住的一句话。" />
          <TextInput label="标签" value={draft.tags} onChange={(value) => updateField("tags", value)} placeholder="抢票, 舞台, 灵感" />
          <MediaSourceInput
            accept="image/*,video/*"
            label="图片或视频"
            onChange={(value) => updateField("mediaUrl", value)}
            value={draft.mediaUrl}
          />
        </div>
        <SubmitRow onClose={onClose} label="保存文档" />
      </form>
    </ModalFrame>
  );
}

function EntryDetailModal({ entry, onClose }: { entry: CmsEntry; onClose: () => void }) {
  const tags = normalizeTags(entry.tags);
  return (
    <ModalFrame eyebrow={categoryLabels[String(entry.type).toUpperCase() as EntryType] ?? "Diary"} title={entry.title} onClose={onClose}>
      <article className="diary-detail">
        <div className="diary-detail-meta">
          <span>{entry.dateText ?? entry.date}</span>
          {entry.location ? <span>{entry.location}</span> : null}
          {entry.artist ? <span>{entry.artist}</span> : null}
          {entry.author?.displayName ? <span>{entry.author.displayName}</span> : null}
        </div>
        <MediaPreview alt={entry.title} className="diary-detail-media" source={entry.mediaUrl} />
        <p>{entry.summary}</p>
        {entry.highlight ? <blockquote>{entry.highlight}</blockquote> : null}
        {tags.length ? <div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
      </article>
    </ModalFrame>
  );
}

function VideoModal({ draft, onClose, onSave, onUpdate }: { draft: VideoDraft; onClose: () => void; onSave: (draft: VideoDraft) => void; onUpdate: (draft: VideoDraft) => void }) {
  function updateField(field: keyof VideoDraft, value: string) {
    onUpdate({ ...draft, [field]: value });
  }
  return (
    <ModalFrame eyebrow="Favorite Video" title="编辑首页顶部视频" onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="writer-grid">
          <TextInput required wide label="标题" value={draft.title} onChange={(value) => updateField("title", value)} placeholder="本周最想反复看的舞台" />
          <TextInput label="发布时间" value={draft.publishDate} onChange={(value) => updateField("publishDate", value)} placeholder="2026.04.21 / 可以填写发布时间" />
          <TextInput label="艺人" value={draft.artist} onChange={(value) => updateField("artist", value)} placeholder="P1Harmony / TREASURE" />
          <TextareaInput required wide label="喜欢原因" value={draft.reason} onChange={(value) => updateField("reason", value)} placeholder="写下为什么喜欢这个视频。" />
          <MediaSourceInput accept="video/*" label="视频" onChange={(value) => updateField("videoUrl", value)} placeholder="上传本地视频，或填写 YouTube / Bilibili / mp4 链接" value={draft.videoUrl} wide />
          <MediaSourceInput accept="image/*" label="封面图片" onChange={(value) => updateField("coverUrl", value)} placeholder="上传本地封面，或填写图片链接" value={draft.coverUrl} wide />
          <TextareaInput wide label="备注" value={draft.note} onChange={(value) => updateField("note", value)} placeholder="可选，写一些补充信息。" />
        </div>
        <SubmitRow onClose={onClose} label="保存顶部视频" />
      </form>
    </ModalFrame>
  );
}

function ScheduleModal({ draft, onClose, onDelete, onSave, onUpdate }: { draft: ScheduleDraft; onClose: () => void; onDelete: (draft: ScheduleDraft) => void; onSave: (draft: ScheduleDraft) => void; onUpdate: (draft: ScheduleDraft) => void }) {
  function updateField(field: keyof ScheduleDraft, value: string) {
    onUpdate({ ...draft, [field]: value });
  }
  return (
    <ModalFrame eyebrow="Timeline" title={draft.id ? "修改行程" : "新增行程"} onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="writer-grid">
          <TextInput required label="日期" value={draft.dateText} onChange={(value) => updateField("dateText", value)} placeholder="04.22" />
          <TextInput required label="艺人" value={draft.artist} onChange={(value) => updateField("artist", value)} placeholder="P1Harmony" />
          <TextInput required wide label="行程标题" value={draft.title} onChange={(value) => updateField("title", value)} placeholder="回归物料整理" />
          <Field label="状态"><select value={draft.status} onChange={(event) => updateField("status", event.target.value)}><option value="PLANNED">计划中</option><option value="IN_PROGRESS">进行中</option><option value="DONE">已完成</option><option value="ARCHIVED">已归档</option></select></Field>
          <TextInput label="链接" value={draft.linkUrl} onChange={(value) => updateField("linkUrl", value)} placeholder="https://..." />
          <TextareaInput wide label="备注" value={draft.note} onChange={(value) => updateField("note", value)} placeholder="这里写补充信息。" />
        </div>
        <SubmitRow dangerLabel={draft.id ? "删除行程" : undefined} label="保存行程" onClose={onClose} onDanger={draft.id ? () => onDelete(draft) : undefined} />
      </form>
    </ModalFrame>
  );
}

function GoalModal({ draft, onClose, onSave, onUpdate }: { draft: GoalDraft; onClose: () => void; onSave: (draft: GoalDraft) => void; onUpdate: (draft: GoalDraft) => void }) {
  function updateField(field: keyof GoalDraft, value: string) {
    onUpdate({ ...draft, [field]: value });
  }
  return (
    <ModalFrame eyebrow="Goal" title={draft.id ? "修改目标" : "添加目标"} onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="writer-grid">
          <TextInput required wide label="目标标题" value={draft.title} onChange={(value) => updateField("title", value)} placeholder="例如：整理一次巡演城市攻略" />
          <TextareaInput required wide label="目标说明" value={draft.detail} onChange={(value) => updateField("detail", value)} placeholder="先做一个通用说明，后续你可以再细化。" />
          <TextInput label="进度" value={draft.progress} onChange={(value) => updateField("progress", value)} placeholder="0" />
          <TextInput label="计划时间" value={draft.dueText} onChange={(value) => updateField("dueText", value)} placeholder="2026.05" />
          <Field label="状态"><select value={draft.status} onChange={(event) => updateField("status", event.target.value)}><option value="PLANNED">计划中</option><option value="IN_PROGRESS">进行中</option><option value="DONE">已完成</option></select></Field>
        </div>
        <SubmitRow onClose={onClose} label="保存目标" />
      </form>
    </ModalFrame>
  );
}

function AchievementModal({ draft, onClose, onSave, onUpdate }: { draft: AchievementDraft; onClose: () => void; onSave: (draft: AchievementDraft) => void; onUpdate: (draft: AchievementDraft) => void }) {
  function updateField(field: keyof AchievementDraft, value: string) {
    onUpdate({ ...draft, [field]: value });
  }
  return (
    <ModalFrame eyebrow="Achievement" title={`添加成就 · ${draft.skillName}`} onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="writer-grid">
          <TextInput required wide label="成就标题" value={draft.title} onChange={(value) => updateField("title", value)} placeholder="例如：剪完第一支舞台混剪" />
          <TextInput label="时间" value={draft.dateText} onChange={(value) => updateField("dateText", value)} placeholder="2026.04" />
          <TextareaInput required wide label="成就内容" value={draft.detail} onChange={(value) => updateField("detail", value)} placeholder="先用通用弹窗记录，后续你可以再改字段。" />
        </div>
        <SubmitRow onClose={onClose} label="保存成就" />
      </form>
    </ModalFrame>
  );
}

function SettingsModal({
  activeTrack,
  onClose,
  onDeleteTrack,
  onSave,
  onSaveMusic,
  settings
}: {
  activeTrack: CmsTrack;
  onClose: () => void;
  onDeleteTrack: (track: CmsTrack) => void;
  onSave: (settings: AppSettings) => void;
  onSaveMusic: (draft: MusicDraft) => Promise<void>;
  settings: AppSettings;
}) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [musicDraft, setMusicDraft] = useState<MusicDraft>(emptyMusicDraft);
  const [savingMusic, setSavingMusic] = useState(false);

  function updateMusicDraft(field: keyof MusicDraft, value: string) {
    const nextDraft = { ...musicDraft, [field]: value };
    if (field === "audioUrl") {
      const guessed = guessTrackMetaFromUrl(value);
      if (!musicDraft.title && guessed.title) nextDraft.title = guessed.title;
      if (!musicDraft.artist && guessed.artist) nextDraft.artist = guessed.artist;
    }
    setMusicDraft(nextDraft);
  }

  async function handleMusicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingMusic(true);
    await onSaveMusic(musicDraft);
    setSavingMusic(false);
    setMusicDraft(emptyMusicDraft);
  }

  return (
    <ModalFrame eyebrow="Settings" title="页面设置" onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="writer-grid">
          <MediaSourceInput
            accept="video/*"
            wide
            label="K-pop 背景视频"
            value={draft.backgroundVideoUrl}
            onChange={(value) => setDraft({ ...draft, backgroundVideoUrl: value })}
            placeholder="上传本地视频，或填入 Bilibili / YouTube / mp4 链接"
          />
          <label className="wide setting-toggle">
            <input
              checked={draft.musicFloating}
              onChange={(event) => setDraft({ ...draft, musicFloating: event.target.checked })}
              type="checkbox"
            />
            <span>音乐播放器使用浮屏形式</span>
          </label>
        </div>
        <SubmitRow onClose={onClose} label="保存设置" />
      </form>
      <form className="music-add-panel" onSubmit={handleMusicSubmit}>
        <div className="modal-subhead">
          <span className="eyebrow">Music</span>
          <h3>添加歌曲</h3>
        </div>
        <div className="writer-grid">
          <MediaSourceInput accept="audio/*" label="本地音乐 / 外部音乐链接" onChange={(value) => updateMusicDraft("audioUrl", value)} placeholder="上传 mp3/wav/ogg，或粘贴 QQ 音乐/网易云音乐链接" value={musicDraft.audioUrl} wide />
          <TextInput label="歌曲名" value={musicDraft.title} onChange={(value) => updateMusicDraft("title", value)} placeholder="自动解析不到时手动填写" />
          <TextInput label="歌手" value={musicDraft.artist} onChange={(value) => updateMusicDraft("artist", value)} placeholder="自动解析不到时手动填写" />
          <TextInput label="备注" value={musicDraft.mood} onChange={(value) => updateMusicDraft("mood", value)} placeholder="例如：睡前循环 / 剪辑提速" />
          <TextInput label="主题色" value={musicDraft.accent} onChange={(value) => updateMusicDraft("accent", value)} placeholder="#D97F9F" />
        </div>
        <div className="modal-actions">
          <button className="danger-button" onClick={() => onDeleteTrack(activeTrack)} type="button"><Trash2 size={17} />删除当前歌曲</button>
          <button className="save-button" disabled={savingMusic} type="submit"><Save size={17} />{savingMusic ? "添加中..." : "添加歌曲"}</button>
        </div>
      </form>
    </ModalFrame>
  );
}

function ScheduleListModal({
  onClose,
  onEdit,
  schedules
}: {
  onClose: () => void;
  onEdit: (schedule: CmsSchedule) => void;
  schedules: CmsSchedule[];
}) {
  return (
    <ModalFrame eyebrow="Schedule" title="全部艺人行程" onClose={onClose}>
      <div className="profile-section-list">
        {schedules.map((schedule, index) => (
          <article className="profile-list-item" key={schedule.id ?? `${schedule.title}-${index}`} onClick={() => onEdit(schedule)}>
            <strong>{schedule.dateText ?? schedule.date} · {schedule.artist}</strong>
            <span>{schedule.title}</span>
            {schedule.note ? <p>{schedule.note}</p> : null}
          </article>
        ))}
      </div>
    </ModalFrame>
  );
}

function AuthModal({ currentUser, onClose, onStatus, onUser }: { currentUser: CurrentUser | null; onClose: () => void; onStatus: (status: string) => void; onUser: (user: CurrentUser | null) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) {
      onStatus(result.message ?? "登录失败。");
      return;
    }
    onStatus(mode === "login" ? "已登录。" : "账号已创建并登录。");
    onUser(result.user);
  }
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="auth-modal" onSubmit={handleSubmit}>
        <div className="modal-head"><div><span className="eyebrow">Account</span><h2>{currentUser ? "当前登录" : mode === "login" ? "登录" : "注册"}</h2></div><button className="icon-button" onClick={onClose} type="button"><X size={18} /></button></div>
        {currentUser ? (
          <div className="current-user-box">
            <ShieldCheck size={18} />
            <p>{currentUser.displayName} 已登录。{currentUser.role === "ADMIN" ? "你现在可以进入数据库后台。" : "数据库后台仅管理员可见。"}</p>
            <button onClick={() => onUser(null)} type="button">退出登录</button>
          </div>
        ) : (
          <>
            <div className="segmented"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button"><LogIn size={15} />登录</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button"><UserPlus size={15} />注册</button></div>
            <label><span>用户名</span><input name="username" required placeholder="your-name" /></label>
            {mode === "register" ? <label><span>显示名称</span><input name="displayName" placeholder="页面里显示的名字" /></label> : null}
            <label><span>密码</span><input name="password" required type="password" placeholder="输入密码" /></label>
            <button className="save-button" type="submit">{mode === "login" ? <LogIn size={17} /> : <UserPlus size={17} />}{mode === "login" ? "登录" : "创建账号"}</button>
          </>
        )}
      </form>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label><span>{label}</span>{children}</label>;
}

function TextInput({ label, onChange, placeholder, required, value, wide }: { label: string; onChange: (value: string) => void; placeholder: string; required?: boolean; value: string; wide?: boolean }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span><input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function TextareaInput({ label, onChange, placeholder, required, value, wide }: { label: string; onChange: (value: string) => void; placeholder: string; required?: boolean; value: string; wide?: boolean }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span><textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function MediaSourceInput({
  accept,
  label,
  onChange,
  placeholder = "https://...",
  value,
  wide
}: {
  accept: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
  wide?: boolean;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const result = await response.json();
    setUploading(false);
    if (!response.ok) {
      setMessage(result.message ?? "上传失败。");
      return;
    }
    onChange(result.url);
    setMessage("本地文件已上传。");
  }

  return (
    <div className={wide ? "media-source-field wide" : "media-source-field"}>
      <span>{label}</span>
      <div className="media-source-row">
        <label className="media-upload-button" htmlFor={inputId}>
          <UploadCloud size={16} />
          {uploading ? "上传中..." : "本地上传"}
        </label>
        <input
          accept={accept}
          className="media-file-input"
          disabled={uploading}
          id={inputId}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
            event.currentTarget.value = "";
          }}
          type="file"
        />
        <div className="media-link-input">
          <Link size={15} />
          <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        </div>
      </div>
      {message ? <small>{message}</small> : null}
    </div>
  );
}

function SubmitRow({ dangerLabel, label, onClose, onDanger }: { dangerLabel?: string; label: string; onClose: () => void; onDanger?: () => void }) {
  return (
    <div className="modal-actions">
      {onDanger ? <button className="danger-button" onClick={onDanger} type="button"><Trash2 size={17} />{dangerLabel}</button> : null}
      <button className="ghost-button" onClick={onClose} type="button">取消</button>
      <button className="save-button" type="submit"><Save size={17} />{label}</button>
    </div>
  );
}

function MiniMusicDock({
  activeTrack,
  isFloating,
  isPlaying,
  onNext,
  onToggle
}: {
  activeTrack: CmsTrack;
  isFloating: boolean;
  isPlaying: boolean;
  onNext: () => void;
  onToggle: () => void;
}) {
  const musicSource = normalizeExternalUrl(activeTrack.audioUrl);
  const playlistEmbedUrl = getMusicPlaylistEmbedUrl(musicSource);

  return (
    <aside className="mini-music" style={{ "--track-accent": activeTrack.accent } as CSSProperties} aria-label="背景音乐播放器">
      {playlistEmbedUrl || activeTrack.audioUrl ? (
        <div className="mini-playlist-player">
          {isPlaying && playlistEmbedUrl ? (
            <iframe className="mini-playlist-frame" src={playlistEmbedUrl} title="歌单播放器" allow="autoplay; encrypted-media" />
          ) : isPlaying && activeTrack.audioUrl ? (
            <audio className="mini-audio-player" src={musicSource} autoPlay controls />
          ) : (
            <div className="mini-playlist-paused">
              <Radio size={20} />
              <strong>{activeTrack.title}</strong>
              <small>点击播放重新载入音乐</small>
            </div>
          )}
          <div className="mini-playlist-actions">
            <button onClick={onToggle} type="button">{isPlaying ? <Pause size={16} /> : <Play size={16} />}{isPlaying ? "暂停" : "播放"}</button>
            {musicSource ? <a href={musicSource} rel="noreferrer" target="_blank">打开来源</a> : null}
          </div>
        </div>
      ) : (
        <>
          <div className="gramophone" aria-hidden="true"><div className={isPlaying ? "record spinning" : "record"} /><div className="horn" /></div>
          <div className="mini-copy"><span><Radio size={13} />BGM</span><strong>{activeTrack.title}</strong><small>{activeTrack.artist} / {activeTrack.mood}</small>{musicSource ? <a href={musicSource} rel="noreferrer" target="_blank">打开来源</a> : null}</div>
          <div className="mini-actions"><button onClick={onToggle} type="button" aria-label={isPlaying ? "暂停背景音乐" : "播放背景音乐"}>{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button><button onClick={onNext} type="button" aria-label="切换下一首背景音乐"><Sparkles size={16} /></button></div>
        </>
      )}
    </aside>
  );
}
