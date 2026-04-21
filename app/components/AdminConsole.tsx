"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Database, Disc3, FileText, Loader2, Send, ShieldCheck, Trash2, Users } from "lucide-react";

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
};

type Entry = {
  id: string;
  title: string;
  type: string;
  summary: string;
  author?: { displayName: string } | null;
};

type Track = {
  id: string;
  artist: string;
  title: string;
  mood: string;
  audioUrl?: string | null;
};

type CmsData = {
  source: string;
  entries?: Entry[];
  musicTracks?: Track[];
};

const sections = [
  { id: "entries", label: "文档审核", Icon: FileText },
  { id: "music", label: "歌曲管理", Icon: Disc3 },
  { id: "users", label: "用户管理", Icon: Users }
] as const;

type SectionId = (typeof sections)[number]["id"];

export function AdminConsole() {
  const [activeSection, setActiveSection] = useState<SectionId>("entries");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [cmsData, setCmsData] = useState<CmsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState("正在读取管理员状态...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    const storedUser = window.localStorage.getItem("idol-diary-user");
    if (storedUser) {
      const user = JSON.parse(storedUser) as AdminUser;
      setCurrentUser(user);
      if (user.role === "ADMIN") {
        refreshAll(user.id);
      } else {
        setStatus("当前账号不是管理员，不能查看数据库后台。");
      }
    } else {
      setStatus("请先回到首页登录管理员账号。");
    }
  }, []);

  async function refreshAll(requesterId = currentUser?.id ?? "") {
    const cmsResponse = await fetch("/api/cms", { cache: "no-store" });
    const cms = (await cmsResponse.json()) as CmsData;
    setCmsData(cms);

    const usersResponse = await fetch(`/api/users?requesterId=${encodeURIComponent(requesterId)}`, { cache: "no-store" });
    if (usersResponse.ok) {
      const userData = (await usersResponse.json()) as { users: AdminUser[] };
      setUsers(userData.users);
    }

    setStatus("管理员后台已连接数据库。");
  }

  async function deleteEntry(entry: Entry) {
    if (!currentUser || !window.confirm(`删除不合规范文档《${entry.title}》吗？`)) return;
    const response = await fetch(`/api/entries?id=${encodeURIComponent(entry.id)}&requesterId=${encodeURIComponent(currentUser.id)}`, {
      method: "DELETE"
    });
    const result = await response.json();
    setStatus(response.ok ? "文档已删除。" : result.message ?? "删除失败。");
    await refreshAll();
  }

  async function deleteUser(user: AdminUser) {
    if (!currentUser || !window.confirm(`删除用户 ${user.displayName} 吗？`)) return;
    const response = await fetch(`/api/users?id=${encodeURIComponent(user.id)}&requesterId=${encodeURIComponent(currentUser.id)}`, {
      method: "DELETE"
    });
    const result = await response.json();
    setStatus(response.ok ? "用户已删除。" : result.message ?? "删除失败。");
    await refreshAll();
  }

  async function deleteMusicTrack(track: Track) {
    if (!currentUser || !window.confirm(`删除歌曲“${track.title}”吗？`)) return;
    const response = await fetch(`/api/music?id=${encodeURIComponent(track.id)}&requesterId=${encodeURIComponent(currentUser.id)}`, {
      method: "DELETE"
    });
    const result = await response.json();
    setStatus(response.ok ? "歌曲/歌单已删除。" : result.message ?? "删除失败。");
    await refreshAll();
  }

  async function handleMusicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, requesterId: currentUser.id })
    });
    const result = await response.json();
    setIsSubmitting(false);
    setStatus(response.ok ? "歌曲已添加。" : result.message ?? "添加失败。");
    if (response.ok) form.reset();
    await refreshAll();
  }

  const counts = useMemo(
    () => [
      ["文档", cmsData?.entries?.length ?? 0],
      ["歌曲", cmsData?.musicTracks?.length ?? 0],
      ["用户", users.length]
    ],
    [cmsData, users]
  );

  if (!isAdmin) {
    return (
      <main className="admin-app">
        <section className="admin-hero">
          <div>
            <span className="eyebrow">Admin Only</span>
            <h1>数据库后台</h1>
            <p>这个页面只对管理员开放。普通用户不会看到首页入口，也不能执行删除和歌曲管理操作。</p>
          </div>
          <div className="admin-status"><ShieldCheck size={18} /><span>{status}</span></div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-app">
      <header className="admin-hero">
        <div>
          <span className="eyebrow">Content Studio</span>
          <h1>数据库后台</h1>
          <p>管理员可以审核并删除不合规范文档、添加歌曲、删除用户。</p>
        </div>
        <div className="admin-status"><Database size={18} /><span>{status}</span></div>
      </header>

      <section className="admin-grid">
        <aside className="admin-sidebar">
          {sections.map(({ id, label, Icon }) => (
            <button className={activeSection === id ? "active" : ""} key={id} onClick={() => setActiveSection(id)} type="button">
              <Icon size={18} />
              {label}
            </button>
          ))}
        </aside>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Manage</span>
              <h2>{sections.find((section) => section.id === activeSection)?.label}</h2>
            </div>
            <button className="refresh-button" onClick={() => refreshAll()} type="button">刷新</button>
          </div>

          {activeSection === "entries" ? (
            <div className="admin-list">
              {cmsData?.entries?.map((entry) => (
                <article key={entry.id}>
                  <div><strong>{entry.title}</strong><span>{entry.type} / {entry.author?.displayName ?? "未登录作者"}</span><p>{entry.summary}</p></div>
                  <button onClick={() => deleteEntry(entry)} type="button"><Trash2 size={16} />删除</button>
                </article>
              ))}
            </div>
          ) : null}

          {activeSection === "music" ? (
            <>
              <form className="admin-form" onSubmit={handleMusicSubmit}>
                <Field name="artist" label="艺人" placeholder="P1Harmony" />
                <Field name="title" label="歌曲名" placeholder="Killin' It" />
                <Field name="mood" label="使用场景" placeholder="启动数据模式" />
                <Field name="accent" label="主题色" placeholder="#D97F9F" />
                <Field name="audioUrl" label="音频链接" placeholder="https://..." />
                <Field name="sortOrder" label="排序" placeholder="1" />
                <button className="submit-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? <Loader2 className="spin" size={17} /> : <Send size={17} />}
                  添加歌曲
                </button>
              </form>
              <div className="admin-list compact">
                {cmsData?.musicTracks?.map((track) => (
                  <article key={track.id}>
                    <div><strong>{track.title}</strong><span>{track.artist} / {track.mood}</span>{track.audioUrl ? <p>{track.audioUrl}</p> : null}</div>
                    <button onClick={() => deleteMusicTrack(track)} type="button"><Trash2 size={16} />删除</button>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {activeSection === "users" ? (
            <div className="admin-list">
              {users.map((user) => (
                <article key={user.id}>
                  <div><strong>{user.displayName}</strong><span>{user.username} / {user.role}</span></div>
                  <button disabled={user.id === currentUser.id} onClick={() => deleteUser(user)} type="button"><Trash2 size={16} />删除</button>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="admin-preview">
          <span className="eyebrow">Overview</span>
          <h2>当前内容</h2>
          <div className="admin-counts">
            {counts.map(([label, value]) => (
              <article key={label}><strong>{value}</strong><span>{label}</span></article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label>
      <span>{label}</span>
      <input name={name} placeholder={placeholder} />
    </label>
  );
}
