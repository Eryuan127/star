# 我的追星日记

一个面向个人追星记录的初版网站：包含线下日记、线上日记、小目标、碎碎念、追星技能展示，并预留 MySQL 数据库结构。

## 技术选择

- `Next.js`：适合做高质感响应式页面，也方便后续扩展后台管理。
- `Prisma + MySQL`：日记、标签、目标、技能这类结构化内容更适合关系型数据库。MySQL 部署成本低，云服务选择多。
- `lucide-react`：使用专业线性图标替代表情符号，保证界面更干净。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 接入 MySQL

1. 复制 `.env.example` 为 `.env`。
2. 修改 `DATABASE_URL`：

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/idol_diary"
```

3. 推送数据库结构：

```bash
npm run db:generate
npm run db:push
```

没有配置数据库时，页面会使用 `lib/data.ts` 里的示例数据，API `/api/entries` 也会返回 fallback 数据，方便先看设计效果。

## 后续建议

- 增加后台编辑页：新增/编辑日记、上传图片、维护技能和目标。
- 增加相册或票根墙：线下日记可以绑定多张图片、票根、座位图和路线截图。
- 增加隐私分级：公开展示、仅自己可见、草稿三种状态。
- 增加筛选系统：按艺人、地区、年份、线上/线下、幸福瞬间分类。
