# 我的追星日记

一个面向个人追星记录的网站，包含线下日记、线上日记、小目标、碎碎念、追星技能展示、音乐和视频模块。

## 技术栈

- `Next.js`: 页面、路由和 API。
- `Prisma + SQLite`: 本地开发数据存储。
- `lucide-react`: 图标。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 公开部署

推荐部署到 Vercel。这样别人可以直接通过公网 URL 打开网站，不需要你的电脑保持开机，也不依赖你的本地开发环境。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Eryuan127/star)

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 数据库说明

`.env.example` 默认使用本地 SQLite:

```env
DATABASE_URL="file:./dev.db"
```

如果线上没有配置 `DATABASE_URL`，网站会使用 `lib/data.ts` 里的示例数据，适合先公开展示页面。

如果要让线上登录、后台编辑、发布内容长期保存，需要改接 hosted database，并在部署平台配置 `DATABASE_URL`。

## 常用命令

```bash
npm run build
npm run db:generate
npm run db:push
```
