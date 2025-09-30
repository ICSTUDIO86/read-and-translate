# Railway 部署 Edge TTS 服务器

## 🎯 目标

将 Edge TTS 服务器部署到 Railway 云平台，实现：
- ✅ 完全免费（每月 500 小时免费额度）
- ✅ 自动 HTTPS
- ✅ 全球可访问
- ✅ GitHub 自动部署
- ✅ 无需电脑运行

---

## 📋 前置要求

- GitHub 账号
- Railway 账号（用 GitHub 登录即可）

---

## 🚀 部署步骤

### 步骤 1：访问 Railway

1. 打开 [railway.app](https://railway.app)
2. 点击右上角 **"Login"**
3. 选择 **"Login with GitHub"**
4. 授权 Railway 访问你的 GitHub 账号

### 步骤 2：创建新项目

1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 如果是第一次，需要点击 **"Configure GitHub App"**
   - 选择授权 Railway 访问哪些仓库
   - 建议选择 **"Only select repositories"**
   - 勾选 `ICSTUDIO86/read-and-translate`
   - 点击 **"Install & Authorize"**

### 步骤 3：选择服务器目录

1. 在项目列表中选择 **"read-and-translate"** 仓库
2. Railway 会询问你要部署哪个服务
3. 点击 **"Add variables"** 或 **"Configure"**
4. **重要**：需要设置 **Root Directory**
   - 找到 **"Settings"** 标签
   - 找到 **"Service Settings"** → **"Root Directory"**
   - 输入：`tts-server`
   - 保存

### 步骤 4：配置环境变量（可选）

默认配置已足够，无需额外设置。

### 步骤 5：部署

1. Railway 会自动检测到 `requirements.txt` 和 `Procfile`
2. 自动开始构建和部署
3. 等待 2-3 分钟，直到状态显示 **"Active"**

### 步骤 6：获取 URL

1. 在项目页面，找到 **"Settings"** → **"Domains"**
2. 点击 **"Generate Domain"**
3. Railway 会生成一个公开 URL，例如：
   ```
   https://read-and-translate-production.up.railway.app
   ```
4. **复制这个 URL**，稍后会用到

---

## ⚙️ 配置前端

### 方法 1：在 Vercel 部署版本配置

1. 访问你的 Vercel 网址：
   ```
   https://read-and-translate-n5y508cic-igors-projects-0bd73000.vercel.app
   ```

2. 进入 **Account** → **Text-to-Speech**

3. 选择 **Edge TTS**

4. 设置 **Edge TTS Server URL**：
   ```
   https://你的Railway域名
   ```

5. 点击 **Test Connection**（应该显示绿色 ✓）

6. **Save Settings**

### 方法 2：在本地开发版本配置

同样的步骤，但访问 `http://localhost:8080`

---

## 🔄 自动部署

配置完成后，每次你 `git push` 到 GitHub：
- Railway 会自动检测更新
- 自动重新构建和部署
- 无需手动操作

---

## 📊 监控和日志

### 查看日志

1. 在 Railway 项目页面
2. 点击 **"Deployments"** 标签
3. 点击最新的部署
4. 查看 **"Build Logs"** 和 **"Deploy Logs"**

### 查看运行状态

- **Metrics** 标签显示：
  - CPU 使用率
  - 内存使用
  - 网络流量

---

## 💰 费用说明

Railway 免费层：
- ✅ 每月 **500 小时**运行时间
- ✅ 每月 **100GB** 网络流量
- ✅ 每月 **100GB** 磁盘空间

Edge TTS 服务器用量：
- 预计每月使用：**50-100 小时**
- 网络流量：**< 1GB**
- **完全在免费额度内**

---

## 🛠️ 故障排除

### 部署失败

**检查**：
1. `tts-server/requirements.txt` 是否存在
2. `tts-server/Procfile` 是否存在
3. Root Directory 是否设置为 `tts-server`

**解决**：
- 查看 Build Logs 中的错误信息
- 确认 Python 版本兼容（Railway 使用 Python 3.11）

### 连接测试失败

**检查**：
1. Railway 服务是否 Active
2. Domain 是否正确生成
3. 前端 URL 是否包含 `https://`

**解决**：
- 访问 Railway URL 直接测试：`https://你的域名/health`
- 应该返回：`{"status": "healthy"}`

### 403 错误

这是 Microsoft Edge TTS API 的临时限流，通常几小时后自动恢复。

**临时解决**：
- 切换到 Web Speech API
- 等待几小时后重试

---

## 🎉 完成

现在你的 Edge TTS 服务器：
- ✅ 全球可访问
- ✅ 无需电脑运行
- ✅ 自动更新
- ✅ 完全免费

**推荐使用策略**：
- **日常使用**：Web Speech（浏览器内置，即时响应）
- **高质量朗读**：Edge TTS（云端，音质好）
- **在家特殊场景**：XTTS v2（本地，最佳音质）

---

## 📚 相关文档

- [Railway 官方文档](https://docs.railway.app)
- [Edge TTS 项目](https://github.com/rany2/edge-tts)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南
