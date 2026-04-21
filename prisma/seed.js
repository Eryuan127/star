const { PrismaClient } = require("@prisma/client");
const { createHash } = require("node:crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { role: "ADMIN" },
    create: {
      username: "admin",
      displayName: "管理员",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      profileSections: "offline,online,notes,goals,skills"
    }
  });

  await prisma.videoSpotlight.create({
    data: {
      title: "本周最想反复看的舞台",
      artist: "P1Harmony / TREASURE / 82MAJOR / 陈立农",
      publishDate: "可以填写发布时间",
      reason: "这里记录为什么喜欢：也许是舞台调度、表情管理、歌词击中、镜头切得刚刚好，或者只是那天刚好被治愈。",
      note: "视频区域后续可以接 YouTube、Bilibili、微博或本地视频链接。"
    }
  });

  await prisma.artistSchedule.createMany({
    data: [
      { dateText: "04.22", artist: "P1Harmony", title: "回归物料整理", status: "PLANNED", note: "补链接和截图。" },
      { dateText: "04.25", artist: "TREASURE", title: "舞台截图归档", status: "IN_PROGRESS", note: "挑选适合做封面的镜头。" },
      { dateText: "04.28", artist: "82MAJOR", title: "安利短视频脚本", status: "PLANNED", note: "先写三个开头。" },
      { dateText: "05.01", artist: "陈立农", title: "采访片段收藏", status: "PLANNED", note: "想写长评。" }
    ]
  });

  await prisma.musicTrack.createMany({
    data: [
      { artist: "P1Harmony", title: "Killin' It", mood: "启动数据模式", accent: "#D97F9F", sortOrder: 1 },
      { artist: "P1Harmony", title: "JUMP", mood: "剪辑提速", accent: "#A6B8A7", sortOrder: 2 },
      { artist: "TREASURE", title: "BONA BONA", mood: "舞台收藏", accent: "#E9D6B7", sortOrder: 3 },
      { artist: "TREASURE", title: "DARARI", mood: "写碎碎念", accent: "#F7D8E6", sortOrder: 4 },
      { artist: "82MAJOR", title: "Choke", mood: "卡点视频", accent: "#9F4E6D", sortOrder: 5 },
      { artist: "82MAJOR", title: "Sure Thing", mood: "入坑资料", accent: "#A6B8A7", sortOrder: 6 },
      { artist: "陈立农", title: "女孩", mood: "安静记录", accent: "#D97F9F", sortOrder: 7 },
      { artist: "陈立农", title: "一半是我", mood: "长期陪伴", accent: "#E9D6B7", sortOrder: 8 }
    ]
  });

  const skillCount = await prisma.skill.count();
  if (skillCount === 0) {
    await prisma.skill.createMany({
      data: [
        { name: "美工排版", level: "进阶中", copy: "封面、应援海报、时间轴长图，重点练习层级、留白和品牌感。", sortOrder: 1 },
        { name: "视频剪辑", level: "持续产出", copy: "舞台混剪、安利向短片、生日企划视频，关注节奏与情绪递进。", sortOrder: 2 },
        { name: "数据运营", level: "可复盘", copy: "投票、音源、社媒互动拆解成清晰任务，减少无效内耗。", sortOrder: 3 },
        { name: "产出号经营", level: "成体系", copy: "内容栏目、视觉模板、发布时间和互动语气逐步沉淀。", sortOrder: 4 }
      ]
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
