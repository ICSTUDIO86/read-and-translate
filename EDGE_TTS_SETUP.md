# Edge TTS 使用指南

## 快速开始

### 1. 启动 Edge TTS 服务器

```bash
cd tts-server
pip install -r requirements.txt
python server.py
```

服务器将在 `http://localhost:5000` 启动

### 2. 配置应用

1. 打开应用: `http://localhost:8080`
2. 进入 **Account** 页面（底部导航栏最右侧）
3. 点击 **"Text-to-Speech"** 设置
4. 选择 **TTS Engine**: "Edge TTS (High Quality, Free)"
5. 点击 **"Test Connection"** 确认服务器运行正常
6. 选择你喜欢的音色（默认：晓晓 - 温柔女声）
7. 点击 **"Save Settings"**

### 3. 开始使用

1. 打开任意书籍
2. 点击播放按钮 ▶️
3. 享受高质量 AI 朗读！

## 手机访问设置

### 方法1：WiFi 局域网访问（推荐）

1. 确保手机和电脑在同一 WiFi
2. 查找电脑 IP 地址：
   - **Mac**: 系统偏好设置 → 网络
   - **Windows**: `ipconfig` 命令
3. 在 Edge TTS 服务器 URL 中输入：`http://你的电脑IP:5000`
4. 在手机浏览器访问：`http://你的电脑IP:8080`

### 方法2：手机直接运行（Android）

使用 Termux 在手机上运行服务器：

```bash
# 安装 Termux
pkg install python
pip install -r requirements.txt
python server.py
```

## 音色推荐

### 中文阅读
- **晓晓** (zh-CN-XiaoxiaoNeural) - 女声，温柔自然，适合长时间阅读
- **云希** (zh-CN-YunxiNeural) - 男声，沉稳专业

### 英文阅读
- **Aria** (en-US-AriaNeural) - 女声，清晰流畅
- **Guy** (en-US-GuyNeural) - 男声，专业稳重

## 特性

✅ **自动语言切换** - 中英文内容自动切换对应音色
✅ **音频缓存** - 相同内容自动缓存，第二次播放秒开
✅ **逐字高亮** - 阅读时跟随高亮当前单词
✅ **离线播放** - 缓存后可离线使用
✅ **完全免费** - 无限制使用

## 故障排除

### 无法连接服务器

1. 确认 Python 服务器正在运行
2. 检查防火墙设置
3. 确认 URL 格式正确：`http://IP:5000`（不要有多余空格）

### 音质不如预期

- 尝试不同的音色
- 调整语速（推荐 1.0x - 1.25x）

### 降级到 Web Speech

如果 Edge TTS 出现问题，可以随时切换回 Web Speech API：
1. Account → Text-to-Speech
2. 选择 "Web Speech API"
3. 立即生效，无需重启

## 对比

| 特性 | Web Speech API | Edge TTS |
|------|----------------|----------|
| 音质 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 极佳 |
| 速度 | ⭐⭐⭐⭐⭐ 即时 | ⭐⭐⭐⭐ 1-2秒 |
| 设置 | ⭐⭐⭐⭐⭐ 零配置 | ⭐⭐⭐ 需要服务器 |
| 离线 | ✅ 完全离线 | ✅ 缓存后离线 |
| 成本 | 免费 | 免费 |

## 推荐使用场景

- **长时间阅读** → Edge TTS（音质好不累）
- **快速浏览** → Web Speech（响应快）
- **离线环境** → Web Speech（无需网络）
- **手机阅读** → Edge TTS + WiFi（最佳体验）
