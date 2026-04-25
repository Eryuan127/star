# 手机 App 打包说明

这个项目已经接入 Capacitor，可以把现有 Next.js 网站封装成 Android / iOS App。因为网站功能依赖 Next.js API、Prisma 数据库和上传目录，App 需要加载一个正在运行的网站地址，才能保持网页和 App 的功能完全一致。

## 本地 Android 调试

先启动网站：

```bash
npm run dev:mobile
```

再开另一个终端运行 Android App：

```bash
npm run mobile:dev
```

`mobile:dev` 默认给 Android 模拟器使用 `http://10.0.2.2:3000`，这是模拟器访问电脑本机服务的地址。
如果检测到 USB 真机，脚本会自动使用电脑的局域网 IP，例如 `http://192.168.x.x:3000`。脚本也会自动设置本机 Android SDK 路径，避免 `ERR_SDK_NOT_FOUND`。

如果是真机调试，把电脑和手机连到同一个 Wi-Fi，然后用电脑局域网 IP 同步：

```bash
$env:CAPACITOR_SERVER_URL="http://你的电脑IP:3000"
npx cap sync android
npx cap run android
```

## 正式打包

先把 Next.js 网站部署到一个 HTTPS 地址，比如 Vercel、自己的服务器或其他 Node.js 托管环境。然后把 App 指向这个地址：

```bash
$env:CAPACITOR_SERVER_URL="https://你的正式网站地址"
npx cap sync
```

Android：

```bash
npm run mobile:android
```

在 Android Studio 里生成 APK 或 AAB。

iOS：

```bash
npm run mobile:ios
```

iOS 需要在 macOS + Xcode 环境里打开、签名和打包。

## 常见注意点

- 正式 App 建议使用 HTTPS 地址，否则 Android/iOS 会有网络安全限制。
- 如果 App 里上传图片或视频，上传内容仍然保存在网站后端对应的 `public/uploads` 或你部署环境配置的存储位置。
- 修改网页样式或功能后，重新部署网站即可；如果 App 里改了 `CAPACITOR_SERVER_URL`、权限或原生配置，需要重新执行 `npx cap sync`。
