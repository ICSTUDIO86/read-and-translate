# 📱 手机阅读 - 混合部署方案

## 🎯 方案概述

这是一个灵活的混合部署方案，让你随时随地使用高质量 AI 朗读：

- **前端**：部署到 Vercel（全球 CDN，免费）
- **TTS 服务**：三种模式灵活切换
  - 🌟 **推荐**：Web Speech API（浏览器内置，即时可用）
  - ☁️ **云端**：Edge TTS on Railway（高质量，全球访问）
  - 🏠 **本地**：XTTS v2（最佳音质，仅在家使用）

---

## ☁️ 云端部署（推荐）

### 为什么选择云端部署？

- ✅ **无需电脑**：随时随地访问
- ✅ **完全免费**：Railway 每月 500 小时免费额度
- ✅ **自动更新**：GitHub push 自动部署
- ✅ **全球可访问**：HTTPS + CDN

### 快速部署 Edge TTS 到 Railway

详细步骤请查看：**[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)**

**简要步骤**：
1. 访问 [railway.app](https://railway.app)，用 GitHub 登录
2. 新建项目 → Deploy from GitHub
3. 选择 `read-and-translate` 仓库
4. 设置 Root Directory 为 `tts-server`
5. 生成域名，复制 URL
6. 在前端配置 Edge TTS Server URL

**部署后**：
- Edge TTS 全球可访问
- 音质：⭐⭐⭐⭐（接近人声）
- 响应速度：1-2 秒
- 费用：完全免费

---

## 🚀 Vercel 部署步骤

### 步骤1：访问 Vercel

1. 打开 [vercel.com](https://vercel.com)
2. 点击 **"Sign Up"** 或 **"Login"**
3. 选择 **"Continue with GitHub"**

### 步骤2：导入项目

1. 在 Vercel 控制台，点击 **"Add New Project"**
2. 找到并选择 **"ICSTUDIO86/read-and-translate"** 仓库
3. 点击 **"Import"**

### 步骤3：配置构建设置

Vercel 会自动检测 Vite 项目，默认配置为：

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**无需修改**，直接点击 **"Deploy"**

### 步骤4：等待部署

- 部署时间：约 1-2 分钟
- 完成后会显示网址，例如：`https://read-and-translate.vercel.app`

### 步骤5：访问应用

- 在浏览器访问你的 Vercel 网址
- 手机浏览器访问同样的网址
- 添加到主屏幕，像原生 App 一样使用

---

## 📱 手机使用指南

### 🏠 在家模式（高质量 TTS）

**适用场景**：在家，电脑和手机连接同一 WiFi

#### 1. 启动电脑服务器

```bash
# 启动 Edge TTS（可选）
cd tts-server
python server.py

# 启动 XTTS v2（推荐）
cd xtts-server
python server.py
```

#### 2. 查找电脑 IP 地址

- **Mac**: 系统偏好设置 → 网络 → 查看 IP
- **Windows**: 命令提示符运行 `ipconfig`
- **Linux**: 终端运行 `ip addr`

假设电脑 IP 是：`192.168.1.100`

#### 3. 手机配置

1. 访问你的 Vercel 网址（例如 `https://read-and-translate.vercel.app`）
2. 进入 **Account** → **Text-to-Speech** 设置
3. 选择 **XTTS v2** 或 **Edge TTS**
4. 配置服务器地址：
   - XTTS Server URL: `http://192.168.1.100:5001`
   - Edge TTS Server URL: `http://192.168.1.100:5000`
5. 点击 **Test Connection** 确认连接
6. **Save Settings**

#### 4. 开始阅读

- 打开任意书籍
- 点击播放 ▶️
- 享受高质量 AI 朗读！

---

### 🚶 外出模式（Web Speech）

**适用场景**：通勤、旅行、没有 WiFi 连接

#### 1. 切换 TTS 引擎

1. 访问 Vercel 网址
2. **Account** → **Text-to-Speech**
3. 选择 **Web Speech API**
4. **Save Settings**

#### 2. 使用特点

- ✅ 完全离线可用
- ✅ 无需服务器
- ✅ 即时响应
- ⚠️ 音质一般（浏览器内置）

---

## 🔄 模式切换

### 快速切换步骤

**在家 → 外出**：
1. Account → TTS 设置
2. 选择 Web Speech API
3. Save

**外出 → 在家**：
1. Account → TTS 设置
2. 选择 XTTS v2 或 Edge TTS
3. 输入电脑 IP
4. Test Connection
5. Save

---

## 📊 功能对比

| 功能 | 在家模式 | 外出模式 |
|------|---------|---------|
| TTS 引擎 | XTTS v2 / Edge TTS | Web Speech |
| 音质 | ⭐⭐⭐⭐⭐ 极佳 | ⭐⭐ 一般 |
| 情感表达 | ✅ 丰富 | ❌ 机械 |
| 网络需求 | WiFi（同局域网） | 无需网络 |
| 电脑要求 | 需要开机运行服务器 | 无需电脑 |
| 响应速度 | 2-4 秒 | 即时 |
| 翻译功能 | ✅ 可用 | ✅ 可用（需网络） |

---

## 🎨 手机优化技巧

### 1. 添加到主屏幕（iOS）

1. Safari 浏览器打开 Vercel 网址
2. 点击底部分享按钮
3. 选择 **"添加到主屏幕"**
4. 设置名称（如 "AI 阅读器"）
5. 添加

### 2. 添加到主屏幕（Android）

1. Chrome 浏览器打开 Vercel 网址
2. 点击右上角菜单
3. 选择 **"添加到主屏幕"**
4. 设置名称
5. 添加

### 3. 全屏阅读

- 添加到主屏幕后，以全屏模式打开
- 无浏览器地址栏干扰
- 完整的沉浸式阅读体验

---

## 💡 使用建议

### 推荐配置

1. **日常使用**：
   - 添加 Vercel 网址到主屏幕
   - 像原生 App 一样打开

2. **在家阅读**：
   - 启动 XTTS 服务器
   - 使用最佳音质朗读
   - 适合长时间阅读

3. **外出阅读**：
   - 切换到 Web Speech
   - 快速查阅、轻度阅读
   - 完全离线可用

4. **翻译功能**：
   - 在家提前翻译好内容
   - 翻译会缓存到浏览器
   - 外出时可以离线阅读翻译

### 省电技巧

- 外出时使用 Web Speech（手机不做运算）
- 在家时电脑做运算，手机只播放

---

## 🔧 故障排除

### 无法连接 TTS 服务器

**症状**：Test Connection 显示红色错误

**解决**：
1. 确认电脑服务器正在运行
2. 确认手机和电脑在同一 WiFi
3. 检查 IP 地址是否正确
4. 检查防火墙是否阻止端口 5000/5001

### 音频播放异常

**解决**：
1. 检查手机音量
2. 检查手机静音开关
3. 刷新页面重试
4. 清除浏览器缓存

### Vercel 部署失败

**解决**：
1. 检查 GitHub 仓库是否公开
2. 确认 `package.json` 中有 `build` 脚本
3. 查看 Vercel 控制台的错误日志
4. 重新部署

---

## 📖 相关文档

- **XTTS_SETUP.md** - XTTS v2 详细设置指南
- **EDGE_TTS_SETUP.md** - Edge TTS 设置指南
- **xtts-server/README.md** - XTTS 服务器文档
- **tts-server/README.md** - Edge TTS 服务器文档

---

## 🎉 总结

通过这个混合方案，你可以：

- ✅ **随时随地阅读** - Vercel 部署，全球访问
- ✅ **灵活切换模式** - 在家高质量，外出轻便
- ✅ **完全免费** - 无任何付费组件
- ✅ **手机友好** - 添加到主屏幕，像原生 App

**立即部署，开启你的 AI 阅读之旅！** 📚
