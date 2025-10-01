# ☁️ Supabase Cloud Sync 使用指南

## 🎯 功能概述

Supabase Cloud Sync 让你的书籍、阅读进度、设置自动在所有设备间同步！

**特点**：
- ✅ **完全免费** - Supabase 免费版额度充足
- ✅ **自动同步** - 上传书籍后自动保存到云端
- ✅ **跨设备** - 电脑、手机、平板无缝同步
- ✅ **隐私保护** - 只有你能访问你的数据
- ✅ **匿名登录** - 无需注册，自动创建账号

---

## 📋 一次性设置（明天醒来后做）

### 步骤 1：在 Supabase 创建数据库表

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. 登录你的账号

3. 选择你的项目（应该已经创建了）

4. 点击左侧菜单的 **SQL Editor**

5. 点击 **New query**

6. 复制粘贴以下内容到编辑器：

打开项目根目录的 `supabase/schema.sql` 文件，复制全部内容

7. 点击右下角的 **Run** 按钮

8. 如果看到 "Success. No rows returned"，说明成功了！

### 步骤 2：启动应用

```bash
# 重启开发服务器（如果还在运行）
npm run dev
```

### 步骤 3：验证云同步

1. 打开浏览器访问 `http://localhost:8080`

2. 进入 **Account** 页面

3. 滚动到 **Cloud Sync** 部分

4. 应该看到：
   - ✓ Connected（绿色）
   - Cloud Books: 0
   - Local Books: [你的书籍数量]

5. 点击 **Upload Local Data to Cloud** 按钮

6. 等待上传完成（会显示进度）

7. 刷新页面，应该看到 Cloud Books 数量和 Local Books 一致

🎉 **完成！** 现在你的数据已经在云端了！

---

## 🚀 使用方法

### 在第一台设备上（例如电脑）

1. **上传现有数据**：
   - Account → Cloud Sync
   - 点击 "Upload Local Data to Cloud"
   - 等待完成

### 在其他设备上（例如手机）

1. **访问应用**：
   - 打开浏览器访问你的 Vercel 网址
   - 或者访问 `http://localhost:8080`

2. **下载云端数据**：
   - Account → Cloud Sync
   - 点击 "Download Cloud Data to Local"
   - 等待完成
   - 刷新页面

3. **查看同步的书籍**：
   - 进入 Library 页面
   - 所有书籍都在这里了！

---

## 🔄 日常使用

### 自动同步

**好消息**：现在所有操作都会自动同步到云端！

- ✅ **上传书籍** → 自动保存到云端
- ✅ **阅读进度** → 自动同步
- ✅ **收藏书籍** → 自动同步
- ✅ **修改设置** → 自动保存

### 首次使用新设备

在新设备上：
1. 打开应用
2. Account → Cloud Sync
3. 点击 "Download Cloud Data to Local"
4. 刷新页面

---

## 📊 云同步状态说明

### 状态指示器

- **✓ Connected**（绿色）：已连接，云同步正常
- **○ Not connected**（灰色）：正在连接

### 数据统计

- **Cloud Books**: 云端存储的书籍数量
- **Local Books**: 浏览器本地的书籍数量
- **Reading Progress**: 云端的阅读进度记录数

### 理想状态

Cloud Books 和 Local Books 数量应该一致。

如果不一致：
- Cloud Books < Local Books → 点击 "Upload to Cloud"
- Cloud Books > Local Books → 点击 "Download from Cloud"

---

## 🛠️ 常见问题

### Q1: 为什么我在 Vercel 上传的书在电脑上看不到？

**A**: 这是因为浏览器 localStorage 是域名隔离的。现在有了云同步，解决方法：

1. 在 Vercel 版本：
   - Account → Cloud Sync
   - 点击 "Upload Local Data to Cloud"

2. 在电脑版：
   - Account → Cloud Sync
   - 点击 "Download Cloud Data to Local"
   - 刷新页面

### Q2: 我需要手动同步吗？

**A**: 不需要！设置好后：
- 新上传的书会自动保存到云端
- 阅读进度自动同步
- 只有在首次使用新设备时，需要点击 "Download from Cloud"

### Q3: 我的数据安全吗？

**A**: 是的！
- 使用 Row Level Security (RLS)，只有你能访问你的数据
- Supabase 是知名的开源云数据库服务
- 匿名账号只保存在你的浏览器中

### Q4: 云端容量够用吗？

**A**: 完全够用！Supabase 免费版：
- 500MB 数据库存储
- 1GB 文件存储
- 50,000 月活跃用户

一本普通书籍只占用约 100-500KB，可以存储数千本书！

### Q5: 如果我不想用云同步怎么办？

**A**: 没问题！你仍然可以：
- 使用 "Manual Backup" 功能导出/导入 JSON 文件
- 所有数据仍然保存在浏览器 localStorage
- 云同步是可选的，不影响本地使用

### Q6: 多个设备同时使用会冲突吗？

**A**: 不会！
- 阅读进度：最新的会覆盖旧的（基于时间戳）
- 书籍：自动合并，不会重复
- 设置：最新的生效

---

## 💡 最佳实践

### 推荐工作流

**电脑端**：
1. 上传和管理书籍
2. 编辑书籍内容
3. 配置 TTS 服务器

**手机端**：
1. 阅读书籍
2. 听 AI 朗读
3. 记录进度

**所有设备**：
- 自动同步进度
- 自动同步收藏
- 设置跨设备一致

### 备份策略

即使有云同步，建议定期：
1. Account → Manual Backup
2. 点击 "Export JSON"
3. 保存 JSON 文件到安全位置

这样即使 Supabase 服务中断，你也有完整备份。

---

## 🔍 技术细节

### 数据库表结构

- **books**: 书籍内容和元数据
- **reading_progress**: 阅读进度（章节、段落）
- **user_settings**: 用户设置（阅读器、TTS配置）
- **favorites**: 收藏的书籍

### 同步策略

- **写入**：同时写入云端和本地 localStorage
- **读取**：优先从云端读取，失败则使用本地
- **离线**：自动回退到 localStorage

### 认证方式

- 使用 Supabase Anonymous Auth
- 无需注册和密码
- 匿名用户 ID 保存在浏览器
- 清除浏览器数据会创建新用户（数据不会丢失）

---

## 🎉 完成

现在你已经设置好 Supabase Cloud Sync！

**享受跨设备无缝阅读体验！** 📚✨

如有问题，查看主 README.md 或提交 Issue。
