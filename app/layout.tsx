import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我的追星日记",
  description: "记录线下经验、线上产出、追星技能和幸福瞬间的个人日记网站。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
