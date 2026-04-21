"use client";

import { type ReactNode, FormEvent, useEffect, useId, useMemo, useState } from "react";
import { ArrowLeft, Check, LayoutGrid, Link, PencilLine, Save, UploadCloud, UserCircle } from "lucide-react";

type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
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
  location?: string | null;
  summary: string;
  highlight?: string | null;
  mediaUrl?: string | null;
  tags?: Array<string | { name: string }>;
  author?: { id: string; displayName: string; username: string } | null;
};

type CmsGoal = {
  id?: string;
  title: string;
  detail: string;
  progress: number;
};

type CmsSkill = {
  id?: string;
  name: string;
  level: string;
  copy: string;
  achievements?: Array<{ id: string; title: string; detail: string; dateText?: string | null }>;
};

type CmsPayload = {
  entries?: CmsEntry[];
  goals?: CmsGoal[];
  skills?: CmsSkill[];
};

type ProfileDraft = {
  displayName: string;
  avatarUrl: string;
  backgroundUrl: string;
  bio: string;
  profileSections: string[];
};

const profileSectionOptions = [
  { id: "offline", label: "线下日记" },
  { id: "online", label: "线上日记" },
  { id: "notes", label: "碎碎念" },
  { id: "goals", label: "小目标" },
  { id: "skills", label: "追星技能" }
];

const defaultSections = ["offline", "online", "notes"];

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

function buildBilibiliEmbed(url?: string | null) {
  const normalized = normalizeExternalUrl(url);
  const bvid = normalized.match(/BV[0-9A-Za-z]+/i)?.[0];
  if (bvid) {
    return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&autoplay=0&muted=1&high_quality=1`;
  }
  const aid = normalized.match(/(?:\/video\/av|[?&]aid=|av)(\d+)/i)?.[1];
  if (aid) {
    return `https://player.bilibili.com/player.html?aid=${aid}&page=1&autoplay=0&muted=1&high_quality=1`;
  }
  return "";
}

function getEmbeddableVideoUrl(url?: string | null) {
  const normalized = normalizeExternalUrl(url);
  if (!normalized) return "";

  const bilibiliEmbed = buildBilibiliEmbed(normalized);
  if (bilibiliEmbed) return bilibiliEmbed;

  try {
    const parsed = new URL(normalized);
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

export function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [cmsData, setCmsData] = useState<CmsPayload | null>(null);
  const [activeSection, setActiveSection] = useState("offline");
  const [isEditing, setIsEditing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const storedUser = window.localStorage.getItem("idol-diary-user");
    if (storedUser) {
      const user = JSON.parse(storedUser) as CurrentUser;
      setCurrentUser(user);
      const sections = (user.profileSections ?? defaultSections.join(",")).split(",").filter(Boolean);
      setDraft({
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? "",
        backgroundUrl: user.backgroundUrl ?? "",
        bio: user.bio ?? "",
        profileSections: sections.length ? sections : defaultSections
      });
      setActiveSection(sections[0] ?? "offline");
    }

    fetch("/api/cms", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: CmsPayload) => setCmsData(data))
      .catch(() => setCmsData(null));
  }, []);

  const ownEntries = useMemo(
    () => (cmsData?.entries ?? []).filter((entry) => entry.author?.id === currentUser?.id),
    [cmsData, currentUser]
  );

  const sections = draft?.profileSections.length ? draft.profileSections : defaultSections;

  function updateDraft(field: keyof ProfileDraft, value: string | string[]) {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  }

  function toggleSection(section: string) {
    if (!draft) return;
    const next = new Set(draft.profileSections);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    const nextSections = Array.from(next);
    setDraft({ ...draft, profileSections: nextSections });
    if (!nextSections.includes(activeSection)) {
      setActiveSection(nextSections[0] ?? "offline");
    }
  }

  async function saveProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!currentUser || !draft) return;

    const response = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: currentUser.id,
        requesterId: currentUser.id,
        displayName: draft.displayName,
        avatarUrl: draft.avatarUrl,
        backgroundUrl: draft.backgroundUrl,
        bio: draft.bio,
        profileSections: draft.profileSections.join(",")
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result.message ?? "个人资料保存失败。");
      return;
    }

    setCurrentUser(result.user);
    window.localStorage.setItem("idol-diary-user", JSON.stringify(result.user));
    setIsEditing(false);
    setIsManaging(false);
    setStatus("个人主页已保存。");
  }

  if (!currentUser || !draft) {
    return (
      <main className="profile-page">
        <section className="profile-shell">
          <a className="profile-back" href="/"><ArrowLeft size={17} />回首页</a>
          <div className="profile-empty-login">
            <UserCircle size={44} />
            <h1>请先登录</h1>
            <p>登录后就可以进入个人主页，选择展示哪些板块并编辑资料。</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <a className="profile-back" href="/"><ArrowLeft size={17} />回首页</a>

        <header className="profile-top-card">
          <div className="profile-cover" style={{ backgroundImage: draft.backgroundUrl && !isVideoSource(draft.backgroundUrl) ? `url(${draft.backgroundUrl})` : undefined }}>
            {isVideoSource(draft.backgroundUrl) ? <video src={draft.backgroundUrl} autoPlay muted loop playsInline /> : null}
          </div>
          <div className="profile-main-row">
            <div className="profile-avatar large">
              {draft.avatarUrl ? <img alt={draft.displayName} src={draft.avatarUrl} /> : <UserCircle size={52} />}
            </div>
            <div>
              <span className="eyebrow">@{currentUser.username}</span>
              <h1>{draft.displayName}</h1>
              <p>{draft.bio || "还没有写个人简介。"}</p>
            </div>
            <div className="profile-top-actions">
              <button onClick={() => setIsEditing((value) => !value)} type="button"><PencilLine size={17} />编辑个人资料</button>
              <button onClick={() => setIsManaging((value) => !value)} type="button"><LayoutGrid size={17} />主页板块</button>
            </div>
          </div>
        </header>

        {status ? <div className="desk-status">{status}</div> : null}

        {isEditing ? (
          <form className="profile-edit-panel" onSubmit={saveProfile}>
            <label><span>昵称</span><input required value={draft.displayName} onChange={(event) => updateDraft("displayName", event.target.value)} /></label>
            <MediaSourceInput accept="image/*" label="头像图片" value={draft.avatarUrl} onChange={(value) => updateDraft("avatarUrl", value)} />
            <MediaSourceInput accept="image/*,video/*" label="主页背景图片/视频" value={draft.backgroundUrl} onChange={(value) => updateDraft("backgroundUrl", value)} wide />
            <label className="wide"><span>个人简介</span><textarea value={draft.bio} onChange={(event) => updateDraft("bio", event.target.value)} placeholder="写一点关于自己的介绍。" /></label>
            <button className="save-button" type="submit"><Save size={17} />保存资料</button>
          </form>
        ) : null}

        {isManaging ? (
          <section className="weibo-module-panel">
            <div>
              <span className="eyebrow">Module Manage</span>
              <h2>选择主页展示板块</h2>
              <p>像微博主页一样，把你想公开展示的内容模块勾选出来，再保存。</p>
            </div>
            <div className="weibo-module-grid">
              {profileSectionOptions.map((section) => {
                const checked = draft.profileSections.includes(section.id);
                return (
                  <button className={checked ? "active" : ""} key={section.id} onClick={() => toggleSection(section.id)} type="button">
                    <span>{section.label}</span>
                    {checked ? <Check size={16} /> : <LayoutGrid size={16} />}
                  </button>
                );
              })}
            </div>
            <button className="save-button" onClick={() => saveProfile()} type="button"><Save size={17} />保存板块</button>
          </section>
        ) : null}

        <nav className="profile-tabbar" aria-label="个人主页板块">
          {sections.map((section) => (
            <button className={activeSection === section ? "active" : ""} key={section} onClick={() => setActiveSection(section)} type="button">
              {profileSectionOptions.find((item) => item.id === section)?.label ?? section}
            </button>
          ))}
        </nav>

        <section className="profile-content-band">
          <ProfileSectionContent activeSection={activeSection} entries={ownEntries} goals={cmsData?.goals ?? []} skills={cmsData?.skills ?? []} />
        </section>
      </section>
    </main>
  );
}

function ProfileSectionContent({
  activeSection,
  entries,
  goals,
  skills
}: {
  activeSection: string;
  entries: CmsEntry[];
  goals: CmsGoal[];
  skills: CmsSkill[];
}) {
  if (activeSection === "goals") {
    return <SimpleCards empty="还没有添加小目标。" rows={goals.map((goal) => ({ id: goal.id ?? goal.title, title: goal.title, body: goal.detail, meta: `${goal.progress}%` }))} />;
  }

  if (activeSection === "skills") {
    return <SimpleCards empty="还没有添加追星技能。" rows={skills.map((skill) => ({ id: skill.id ?? skill.name, title: skill.name, body: skill.copy, meta: skill.level }))} />;
  }

  const typeMap: Record<string, string> = {
    offline: "OFFLINE",
    online: "ONLINE",
    notes: "NOTE"
  };
  const rows = entries
    .filter((entry) => String(entry.type).toUpperCase() === typeMap[activeSection])
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      body: entry.summary,
      mediaUrl: entry.mediaUrl ?? "",
      meta: [entry.dateText, entry.location].filter(Boolean).join(" / ")
    }));

  return <SimpleCards empty="这个板块还没有内容。" rows={rows} />;
}

function SimpleCards({ empty, rows }: { empty: string; rows: Array<{ id: string; title: string; body: string; mediaUrl?: string; meta?: string }> }) {
  if (!rows.length) {
    return <article className="profile-empty-card">{empty}</article>;
  }

  return (
    <div className="profile-card-list">
      {rows.map((row) => (
        <article className="profile-feed-card" key={row.id}>
          {row.meta ? <span>{row.meta}</span> : null}
          <h3>{row.title}</h3>
          <MediaPreview alt={row.title} source={row.mediaUrl} />
          <p>{row.body}</p>
        </article>
      ))}
    </div>
  );
}

function MediaPreview({ alt, source }: { alt: string; source?: string | null }) {
  const normalizedSource = normalizeExternalUrl(source);
  const embedUrl = getEmbeddableVideoUrl(normalizedSource);
  if (!normalizedSource) return null;
  if (isVideoSource(normalizedSource)) {
    return <div className="profile-feed-media"><video controls src={normalizedSource} /></div>;
  }
  if (isImageSource(normalizedSource) || normalizedSource.startsWith("/uploads/")) {
    return <div className="profile-feed-media"><img alt={alt} src={normalizedSource} /></div>;
  }
  if (embedUrl) {
    return <div className="profile-feed-media"><iframe src={embedUrl} title={alt} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>;
  }
  return <div className="profile-feed-media"><ResolvedEmbedFrame source={normalizedSource} title={alt} fallback={<a className="entry-link-card" href={normalizedSource} rel="noreferrer" target="_blank">打开链接</a>} /></div>;
}

function ResolvedEmbedFrame({ fallback, source, title }: { fallback: ReactNode; source: string; title: string }) {
  const [embedUrl, setEmbedUrl] = useState(getEmbeddableVideoUrl(source));
  const normalizedSource = normalizeExternalUrl(source);

  useEffect(() => {
    let ignore = false;
    const directEmbed = getEmbeddableVideoUrl(normalizedSource);
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
  }, [normalizedSource]);

  if (!embedUrl) return <>{fallback}</>;
  return <iframe src={embedUrl} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
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
