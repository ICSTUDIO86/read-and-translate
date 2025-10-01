# Cloud Deployment Guide for Edge TTS Server

部署 Edge TTS 服务器到云端，支持手机和任何设备访问。

## 🚀 推荐部署平台

### 1️⃣ Railway（推荐，最简单）

**优点：**
- ✅ 免费额度：每月 $5 credit（足够使用）
- ✅ 自动部署：推送代码自动构建
- ✅ HTTPS 支持：自动提供安全连接
- ✅ 零配置：检测到 Python 自动配置

**部署步骤：**

1. **注册 Railway**
   - 访问 [railway.app](https://railway.app)
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 `read-and-translate` 仓库

3. **配置服务**
   - Root Directory: `edge-tts-server`
   - 等待自动构建完成

4. **获取 URL**
   - 构建完成后，点击 "Settings" → "Public Networking"
   - 点击 "Generate Domain"
   - 复制生成的 URL（类似：`https://edge-tts-server-production.up.railway.app`）

5. **测试连接**
   ```bash
   curl https://your-app.up.railway.app/health
   ```

6. **在 BookReader 中配置**
   - 打开 BookReader TTS 设置
   - Edge TTS Server URL 填入：`https://your-app.up.railway.app`
   - 点击 Test Connection
   - 保存设置

---

### 2️⃣ Render

**优点：**
- ✅ 完全免费（有限制）
- ✅ 自动部署
- ✅ HTTPS 支持

**限制：**
- ⚠️ 免费实例会休眠（15分钟无活动）
- ⚠️ 冷启动需要 30-60 秒

**部署步骤：**

1. **注册 Render**
   - 访问 [render.com](https://render.com)
   - 使用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库
   - 选择 `read-and-translate`

3. **配置服务**
   - Name: `edge-tts-server`
   - Root Directory: `edge-tts-server`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python server.py`
   - Instance Type: `Free`

4. **部署并获取 URL**
   - 点击 "Create Web Service"
   - 等待部署完成（5-10分钟）
   - 复制 URL（类似：`https://edge-tts-server.onrender.com`）

5. **在 BookReader 中配置**
   - Edge TTS Server URL: `https://edge-tts-server.onrender.com`
   - 第一次使用需要等待服务唤醒（30-60秒）

---

### 3️⃣ Fly.io

**优点：**
- ✅ 免费额度充足
- ✅ 全球 CDN
- ✅ 不会休眠

**部署步骤：**

1. **安装 Fly CLI**
   ```bash
   # macOS
   brew install flyctl

   # Windows
   iwr https://fly.io/install.ps1 -useb | iex

   # Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **登录并初始化**
   ```bash
   cd edge-tts-server
   flyctl auth login
   flyctl launch
   ```

3. **配置问题**
   - App name: `edge-tts-server-<your-name>`
   - Region: 选择离你最近的（如 `hkg` 香港）
   - Would you like to set up a database? **No**
   - Would you like to deploy now? **Yes**

4. **获取 URL**
   ```bash
   flyctl info
   ```
   URL 类似：`https://edge-tts-server-your-name.fly.dev`

5. **在 BookReader 中配置**
   - Edge TTS Server URL: `https://edge-tts-server-your-name.fly.dev`

---

## 📱 移动设备使用

部署到云端后，你的手机可以通过以下方式使用：

### iPhone/iPad

1. 访问 `https://books.icstudio.club`
2. 进入 Settings → Text-to-Speech
3. 选择 Edge TTS
4. Server URL 填入你的云端地址
5. Test Connection
6. 保存并使用

### Android

与 iPhone 步骤相同

---

## 🔒 安全建议

### 添加 API Key 保护（可选）

如果担心服务被滥用，可以添加 API Key：

1. **修改 `server.py`：**
   ```python
   API_KEY = os.environ.get('API_KEY', '')

   @app.before_request
   def check_api_key():
       if API_KEY and request.headers.get('X-API-Key') != API_KEY:
           return jsonify({'error': 'Invalid API key'}), 401
   ```

2. **在云平台设置环境变量：**
   - Railway: Settings → Variables → Add `API_KEY=your-secret-key`
   - Render: Environment → Add `API_KEY=your-secret-key`

3. **在 BookReader 中配置：**
   需要修改前端代码添加 API Key header

---

## 💰 成本估算

### Railway
- 免费额度：$5/月 credit
- 估算使用：
  - 个人使用：约 $0-2/月（免费额度内）
  - 轻度使用：完全免费

### Render
- 免费层：完全免费
- 限制：会休眠，需要唤醒时间

### Fly.io
- 免费额度：足够个人使用
- 3个共享 CPU VMs 免费
- 160GB 出站流量/月

---

## 🐛 常见问题

### 部署后无法连接

1. **检查 CORS 设置**
   - `server.py` 已配置 `CORS(app)`，允许所有来源

2. **检查 HTTPS**
   - 确保使用 `https://` 而不是 `http://`

3. **检查端口**
   - 云平台会自动处理端口，无需指定端口号

### Render 服务休眠

**解决方案 1 - 使用 Uptime Monitor（推荐）：**
- 注册 [UptimeRobot](https://uptimerobot.com)（免费）
- 添加监控：每 5 分钟 ping 一次你的 health endpoint
- 这样服务不会休眠

**解决方案 2 - 升级到付费计划：**
- Render Starter: $7/月，永不休眠

### Railway 超出免费额度

1. **优化缓存**
   - 启用缓存减少 TTS 生成次数
   - 定期清理旧缓存

2. **升级计划**
   - Hobby Plan: $5/月，$5 credit
   - 按需付费

---

## 📊 监控和维护

### 查看日志

**Railway:**
```bash
# 安装 CLI
npm install -g @railway/cli

# 查看日志
railway logs
```

**Render:**
- Dashboard → Logs 标签页

**Fly.io:**
```bash
flyctl logs
```

### 健康检查

所有平台都配置了健康检查：
```bash
curl https://your-server.com/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "Edge TTS Server",
  "cache_files": 10
}
```

---

## 🎉 部署完成后

1. ✅ 记录你的服务器 URL
2. ✅ 在 BookReader 中配置
3. ✅ 在手机上测试
4. ✅ 享受高质量的 AI 朗读！

---

## 需要帮助？

如果部署遇到问题：
1. 检查云平台的构建日志
2. 确保 `requirements.txt` 中的依赖都能安装
3. 查看服务器日志排查错误
4. 提交 GitHub issue
