import {
  BadgeCheck,
  BookOpenText,
  Brush,
  CalendarHeart,
  Camera,
  CheckCircle2,
  Clapperboard,
  Compass,
  Disc3,
  HeartHandshake,
  LineChart,
  MessageCircleHeart,
  Sparkles,
  Target,
  TicketCheck,
  Wand2
} from "lucide-react";

export type DiaryEntry = {
  id: string;
  type: "offline" | "online" | "goal" | "note" | "skill";
  title: string;
  date: string;
  location?: string;
  summary: string;
  tags: string[];
  highlight: string;
};

export type MusicTrack = {
  id: string;
  artist: "P1Harmony" | "TREASURE" | "82MAJOR" | "陈立农";
  title: string;
  mood: string;
  accent: string;
};

export type VideoPick = {
  title: string;
  artist: string;
  publishDate: string;
  reason: string;
  note: string;
};

export type ScheduleItem = {
  date: string;
  artist: string;
  title: string;
  status: string;
};

export const navItems = [
  { id: "home", label: "首页", Icon: BookOpenText },
  { id: "offline", label: "线下日记", Icon: TicketCheck },
  { id: "online", label: "线上日记", Icon: LineChart },
  { id: "goals", label: "小目标", Icon: Target },
  { id: "skills", label: "追星技能", Icon: Brush },
  { id: "notes", label: "碎碎念", Icon: MessageCircleHeart }
] as const;

export const stats = [
  { label: "线下回忆", value: "18", Icon: Camera },
  { label: "数据企划", value: "42", Icon: LineChart },
  { label: "被看见瞬间", value: "7", Icon: BadgeCheck },
  { label: "背景歌单", value: "24", Icon: Disc3 }
];

export const videoPick: VideoPick = {
  title: "本周最想反复看的舞台",
  artist: "P1Harmony / TREASURE / 82MAJOR / 陈立农",
  publishDate: "可以填写发布时间",
  reason: "这里记录为什么喜欢：也许是舞台调度、表情管理、歌词击中、镜头切得刚刚好，或者只是那天刚好被治愈。",
  note: "视频区域后续可以接 YouTube、Bilibili、微博或本地视频链接。"
};

export const scheduleItems: ScheduleItem[] = [
  { date: "04.22", artist: "P1Harmony", title: "回归物料整理", status: "待补链接" },
  { date: "04.25", artist: "TREASURE", title: "舞台截图归档", status: "进行中" },
  { date: "04.28", artist: "82MAJOR", title: "安利短视频脚本", status: "草稿" },
  { date: "05.01", artist: "陈立农", title: "采访片段收藏", status: "想写长评" }
];

export const offlineEntries: DiaryEntry[] = [
  {
    id: "offline-1",
    type: "offline",
    title: "首尔打歌行程动线复盘",
    date: "2026.03",
    location: "Seoul",
    summary: "从预录排队、交通换乘到周边补给，整理第一次去打歌现场最容易忽略的真实细节。",
    tags: ["动线", "排队", "补给"],
    highlight: "把体力预算放在交通和等待上，不要只计划舞台时间。"
  },
  {
    id: "offline-2",
    type: "offline",
    title: "内娱演唱会抢票与入场小册",
    date: "2025.12",
    location: "Shanghai",
    summary: "实名制、电子票、寄存、拍摄限制和散场地铁选择，沉淀成下次现场可复用的清单。",
    tags: ["抢票", "入场", "散场"],
    highlight: "提前截图二维码和座位信息，现场网络拥堵时会非常有用。"
  }
];

export const onlineEntries: DiaryEntry[] = [
  {
    id: "online-1",
    type: "online",
    title: "新歌回归数据看板",
    date: "2026.02",
    summary: "把音源、投票、社媒互动拆成每日任务，记录哪些动作真的有反馈，哪些只是焦虑式重复。",
    tags: ["数据", "回归", "复盘"],
    highlight: "最有效的是固定时间段的小队协作，而不是全天候消耗自己。"
  },
  {
    id: "online-2",
    type: "online",
    title: "被偶像翻牌那一天",
    date: "2025.10",
    summary: "保存文案、图片、发布时间和心情，顺便复盘什么样的表达真诚又容易被看见。",
    tags: ["翻牌", "文案", "幸福瞬间"],
    highlight: "比起完美修辞，具体的喜欢更有生命力。"
  }
];

export const musicTracks: MusicTrack[] = [
  { id: "p1h-1", artist: "P1Harmony", title: "Killin' It", mood: "启动数据模式", accent: "#D97F9F" },
  { id: "p1h-2", artist: "P1Harmony", title: "JUMP", mood: "剪辑提速", accent: "#A6B8A7" },
  { id: "treasure-1", artist: "TREASURE", title: "BONA BONA", mood: "舞台收藏", accent: "#E9D6B7" },
  { id: "treasure-2", artist: "TREASURE", title: "DARARI", mood: "写碎碎念", accent: "#F7D8E6" },
  { id: "major-1", artist: "82MAJOR", title: "Choke", mood: "卡点视频", accent: "#9F4E6D" },
  { id: "major-2", artist: "82MAJOR", title: "Sure Thing", mood: "入坑资料", accent: "#A6B8A7" },
  { id: "cln-1", artist: "陈立农", title: "女孩", mood: "安静记录", accent: "#D97F9F" },
  { id: "cln-2", artist: "陈立农", title: "一半是我", mood: "长期陪伴", accent: "#E9D6B7" }
];

export const goals = [
  {
    title: "完成一套巡演城市攻略",
    progress: 68,
    Icon: Compass,
    detail: "交通、住宿、周边打卡、应援点位统一成可复用模板。"
  },
  {
    title: "剪出年度舞台混剪",
    progress: 44,
    Icon: Clapperboard,
    detail: "按情绪和舞台美学分章节，而不是单纯堆高光。"
  },
  {
    title: "做一个产出号视觉规范",
    progress: 25,
    Icon: Wand2,
    detail: "封面、字幕、色彩、排版和发布节奏形成稳定识别。"
  }
];

export const skills = [
  {
    name: "美工排版",
    level: "进阶中",
    Icon: Brush,
    copy: "封面、应援海报、时间轴长图，重点练习层级、留白和品牌感。"
  },
  {
    name: "视频剪辑",
    level: "持续产出",
    Icon: Clapperboard,
    copy: "舞台混剪、安利向短片、生日企划视频，关注节奏与情绪递进。"
  },
  {
    name: "数据运营",
    level: "可复盘",
    Icon: LineChart,
    copy: "投票、音源、社媒互动拆解成清晰任务，减少无效内耗。"
  },
  {
    name: "产出号经营",
    level: "成体系",
    Icon: Sparkles,
    copy: "内容栏目、视觉模板、发布时间和互动语气逐步沉淀。"
  }
];

export const notes = [
  {
    title: "今天也被舞台治愈",
    body: "喜欢不是任务清单，偶尔只是打开一个舞台，然后突然想把生活收拾得更明亮一点。",
    Icon: HeartHandshake
  },
  {
    title: "给未来的自己",
    body: "追星最珍贵的副产品，是我学会了做图、剪辑、规划、表达，也更懂如何照顾自己的热情。",
    Icon: CalendarHeart
  },
  {
    title: "收藏一个小原则",
    body: "把爱意放进作品里，把边界留给生活。开心要被记录，疲惫也可以被温柔地暂停。",
    Icon: CheckCircle2
  }
];
