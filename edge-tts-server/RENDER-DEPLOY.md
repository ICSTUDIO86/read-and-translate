# Render 免费部署指南（100% 免费，不会扣费）

完整的 Render 免费部署步骤，包括防休眠设置。

---

## 📋 准备工作

- ✅ GitHub 账号
- ✅ 代码已推送到 GitHub
- ❌ **不需要信用卡**
- ❌ **不会扣费**

---

## 🚀 第一步：部署到 Render（5分钟）

### 1. 注册 Render

1. 访问 [render.com](https://render.com)
2. 点击右上角 **"Get Started"**
3. 选择 **"Sign up with GitHub"**
4. 授权 Render 访问你的 GitHub

![Render注册](https://docs.render.com/images/github-signup.png)

---

### 2. 创建 Web Service

1. 登录后点击 **"New +"** 按钮（右上角）
2. 选择 **"Web Service"**

![创建Web Service](https://docs.render.com/images/new-web-service.png)

---

### 3. 连接 GitHub 仓库

1. 在列表中找到 **`read-and-translate`** 仓库
2. 点击右侧的 **"Connect"** 按钮

如果没看到仓库：
- 点击 **"Configure account"**
- 授权 Render 访问该仓库

---

### 4. 配置服务

填写以下配置信息：

#### **基本设置**
```
Name: edge-tts-server
```
（可以自定义名字，只能用小写字母、数字、连字符）

#### **Root Directory**
```
edge-tts-server
```
⚠️ **重要**：必须填写这个，指向服务器代码所在目录

#### **Runtime**
```
Python 3
```

#### **Build Command**
```
pip install -r requirements.txt
```

#### **Start Command**
```
python server.py
```

#### **Instance Type**
选择 **"Free"**
- ✅ 完全免费
- ✅ 750 小时/月
- ✅ 足够个人使用

![配置界面](https://i.imgur.com/example.png)

---

### 5. 高级设置（可选）

展开 **"Advanced"** 部分：

#### **Auto-Deploy**
- 保持默认 **"Yes"**
- 推送代码时自动部署

#### **Health Check Path**
```
/health
```

---

### 6. 创建 Web Service

1. 检查所有配置正确
2. 点击底部的 **"Create Web Service"** 按钮
3. 等待部署完成（5-10分钟）

你会看到构建日志：
```
==> Building...
==> Installing dependencies...
==> Starting server...
==> Your service is live 🎉
```

---

### 7. 获取服务器 URL

部署成功后：
1. 在页面顶部可以看到你的 URL
2. 格式类似：`https://edge-tts-server-xxxx.onrender.com`
3. 复制这个 URL

---

### 8. 测试服务器

在浏览器打开：
```
https://你的服务器.onrender.com/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "Edge TTS Server",
  "cache_files": 0
}
```

✅ **如果看到这个，说明部署成功！**

---

## ⏰ 第二步：防止休眠（5分钟）

Render 免费版会在 15 分钟无活动后休眠。解决方案：使用 UptimeRobot 每 5 分钟 ping 一次。

### 1. 注册 UptimeRobot

1. 访问 [uptimerobot.com](https://uptimerobot.com)
2. 点击 **"Free Sign Up"**
3. 填写邮箱和密码
4. 验证邮箱

---

### 2. 创建监控

1. 登录后点击 **"+ Add New Monitor"**
2. 填写以下信息：

#### **Monitor Type**
```
HTTP(s)
```

#### **Friendly Name**
```
Edge TTS Server
```

#### **URL (or IP)**
```
https://你的服务器.onrender.com/health
```
⚠️ 替换成你的实际 URL

#### **Monitoring Interval**
```
5 minutes
```
（免费版支持最短 5 分钟）

![UptimeRobot设置](https://i.imgur.com/example2.png)

3. 点击 **"Create Monitor"**

---

### 3. 验证监控

1. 等待 5 分钟
2. 查看监控状态应该是 **"Up"**（绿色）
3. ✅ 现在你的服务器不会休眠了！

---

## 📱 第三步：在 BookReader 中配置（2分钟）

### 1. 打开 BookReader

访问：https://books.icstudio.club

---

### 2. 进入 TTS 设置

1. 点击右上角 ⚙️ 设置图标
2. 或者点击底部导航的 **"Settings"**
3. 找到 **"Text-to-Speech Settings"**

---

### 3. 配置 Edge TTS

1. **TTS Engine** 下拉框选择：
   ```
   Edge TTS (High Quality, Free)
   ```

2. **Edge TTS Server URL** 填入：
   ```
   https://你的服务器.onrender.com
   ```
   ⚠️ 注意：
   - ✅ 使用 `https://`（不是 http）
   - ✅ 不要在末尾加 `/`
   - ✅ 不要加端口号

3. 点击 **"Test Connection"** 按钮

4. 如果看到绿色提示或红色错误消失，说明连接成功 ✅

5. 点击 **"Save Settings"** 保存

---

### 4. 测试 TTS 功能

1. 打开任意一本书
2. 点击页面上的播放按钮 ▶️
3. 应该开始朗读
4. 在 toast 通知中会显示 "Started AI reading with edge-tts"

✅ **成功！现在你可以在任何设备上使用高质量 TTS 了！**

---

## 📱 第四步：手机上使用

### iPhone/iPad

1. 打开 Safari 浏览器
2. 访问：`https://books.icstudio.club`
3. TTS 已经配置好，直接使用！
4. （可选）添加到主屏幕：
   - 点击分享按钮
   - 选择 "添加到主屏幕"
   - 像 App 一样使用

### Android

1. 打开 Chrome 浏览器
2. 访问：`https://books.icstudio.club`
3. TTS 已经配置好，直接使用！
4. （可选）添加到主屏幕：
   - 点击菜单
   - 选择 "添加到主屏幕"

---

## 🔍 常见问题

### Q: 第一次使用很慢，需要等很久？

**A:** 这是正常的。Render 免费版休眠后需要 30-60 秒唤醒。

**解决方案：**
- 确保已设置 UptimeRobot 监控
- 监控会保持服务活跃，之后就快了

---

### Q: 显示 "Server not accessible" 错误？

**A:** 检查以下几点：

1. **URL 是否正确**
   - ✅ `https://你的服务器.onrender.com`
   - ❌ 不要加 `/health` 或其他路径
   - ❌ 不要加端口号 `:5002`

2. **服务器是否在运行**
   - 打开 Render dashboard
   - 查看服务状态是否为 "Live"

3. **CORS 问题**
   - server.py 已配置 CORS，应该没问题

4. **服务刚部署完成**
   - 等待 1-2 分钟让服务完全启动

---

### Q: 可以看到日志吗？

**A:** 可以！

1. 打开 Render dashboard
2. 进入你的服务
3. 点击 **"Logs"** 标签页
4. 可以看到实时日志

---

### Q: 如何更新服务器代码？

**A:** 非常简单，自动的！

1. 在本地修改代码
2. 推送到 GitHub
3. Render 自动检测并重新部署
4. 等待几分钟完成

---

### Q: 会产生费用吗？

**A:** 不会！

- ✅ Render Free Tier 永久免费
- ✅ UptimeRobot 免费版足够使用
- ✅ 不需要信用卡
- ✅ 不会自动扣费

---

### Q: 免费版的限制是什么？

**A:** Render Free Tier 限制：

- 750 小时/月（每月 31 天 = 744 小时）
- 15 分钟无活动会休眠（用 UptimeRobot 解决）
- 512 MB RAM（足够使用）
- 共享 CPU（个人使用没问题）

---

### Q: 如果超出 750 小时会怎样？

**A:** 不会扣费！

- 服务会停止运行
- 不会产生任何费用
- 下个月会重置额度

但实际上，使用 UptimeRobot 保持活跃，一个月 = 720 小时，不会超额。

---

### Q: 可以自定义域名吗？

**A:** 可以，但需要付费计划。免费版使用 Render 提供的域名。

---

## 📊 部署完成检查清单

- [ ] Render 服务已部署并显示 "Live"
- [ ] 可以访问 `/health` 并返回正确 JSON
- [ ] UptimeRobot 监控已设置并显示 "Up"
- [ ] BookReader TTS 设置中 Test Connection 成功
- [ ] 可以在浏览器中播放 TTS
- [ ] 可以在手机上访问和使用

全部打勾后，部署完成！🎉

---

## 🆘 需要帮助？

如果遇到问题：

1. **检查 Render 日志**
   - Dashboard → Logs
   - 查看错误信息

2. **检查浏览器控制台**
   - F12 → Console 标签页
   - 查看网络请求是否成功

3. **提交 Issue**
   - GitHub 仓库提交问题
   - 附上错误截图和日志

---

## 🎉 恭喜！

你现在有了：
- ✅ 免费的云端 TTS 服务器
- ✅ 可以在任何设备上使用
- ✅ 不会产生任何费用
- ✅ 高质量的语音合成

享受阅读吧！📚
