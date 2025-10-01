# Edge TTS Server for BookReader

高质量的 Text-to-Speech 服务器，使用 Microsoft Edge TTS 引擎。

## 功能特性

- ✅ 高质量语音合成（Microsoft Edge TTS）
- ✅ 支持多种语言和语音
- ✅ 自动缓存生成的音频文件
- ✅ CORS 支持，可从浏览器直接调用
- ✅ RESTful API 接口

## 快速开始

### 1. 安装依赖

确保你已安装 Python 3.8 或更高版本。

```bash
cd edge-tts-server

# 安装依赖
pip install -r requirements.txt
```

### 2. 启动服务器

```bash
python server.py
```

服务器将在 `http://localhost:5002` 启动。

你应该看到类似输出：

```
============================================================
Edge TTS Server for BookReader
============================================================
Cache directory: /tmp/edge-tts-cache
Server starting on http://localhost:5002
============================================================

Endpoints:
  GET  /health       - Health check
  GET  /voices       - List available voices
  POST /synthesize   - Generate speech from text
  POST /clear-cache  - Clear audio cache

Press Ctrl+C to stop
============================================================
```

### 3. 测试服务器

在浏览器中访问：
```
http://localhost:5002/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "Edge TTS Server",
  "cache_dir": "/tmp/edge-tts-cache",
  "cache_files": 0
}
```

### 4. 在 BookReader 中使用

1. 打开 BookReader 应用
2. 进入 **Text-to-Speech Settings**
3. 选择 **Edge TTS (High Quality, Free)**
4. 确认 Server URL 为 `http://localhost:5002`
5. 点击 **Test Connection**
6. 如果成功，保存设置并开始使用！

## API 接口

### GET /health

健康检查

**响应：**
```json
{
  "status": "ok",
  "service": "Edge TTS Server",
  "cache_dir": "/tmp/edge-tts-cache",
  "cache_files": 5
}
```

### GET /voices

获取所有可用语音列表

**响应：**
```json
{
  "voices": [
    {
      "name": "zh-CN-XiaoxiaoNeural",
      "gender": "Female",
      "locale": "zh-CN",
      "friendlyName": "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)"
    }
  ],
  "count": 400
}
```

### POST /synthesize

生成语音

**请求：**
```json
{
  "text": "Hello, this is a test.",
  "voice": "en-US-AriaNeural",
  "rate": "+0%",
  "pitch": "+0Hz"
}
```

**响应：**
- Content-Type: `audio/mpeg`
- 返回 MP3 音频文件

### POST /clear-cache

清除缓存

**响应：**
```json
{
  "status": "ok",
  "cleared": 10,
  "message": "Cleared 10 cached files"
}
```

## 常见问题

### 服务器无法启动

**错误：`ModuleNotFoundError: No module named 'edge_tts'`**

解决方案：
```bash
pip install -r requirements.txt
```

### 端口 5002 已被占用

**错误：`Address already in use`**

解决方案：
1. 查找占用端口的进程：
   ```bash
   lsof -i :5002
   ```

2. 终止进程：
   ```bash
   kill -9 <PID>
   ```

3. 或者修改 `server.py` 中的端口号

### 浏览器无法连接

确保：
1. ✅ 服务器正在运行
2. ✅ 使用 `http://localhost:5002`（不是 https）
3. ✅ 浏览器允许访问 localhost

## 支持的语音

### 中文
- `zh-CN-XiaoxiaoNeural` - 晓晓（女声，温柔）
- `zh-CN-YunxiNeural` - 云希（男声）
- `zh-CN-YunyangNeural` - 云扬（男声，新闻播报）
- `zh-TW-HsiaoChenNeural` - 台湾繁体（女声）

### 英文
- `en-US-AriaNeural` - 美式英语（女声）
- `en-US-GuyNeural` - 美式英语（男声）
- `en-GB-SoniaNeural` - 英式英语（女声）

### 其他语言
- `ja-JP-NanamiNeural` - 日语（女声）
- `ko-KR-SunHiNeural` - 韩语（女声）
- `es-ES-ElviraNeural` - 西班牙语（女声）
- `fr-FR-DeniseNeural` - 法语（女声）
- `de-DE-KatjaNeural` - 德语（女声）

完整语音列表请访问：`http://localhost:5002/voices`

## 性能优化

### 缓存机制

服务器会自动缓存生成的音频文件：
- 相同的文本 + 语音 + 参数 = 直接返回缓存
- 缓存位置：`/tmp/edge-tts-cache/`
- 清除缓存：`POST /clear-cache`

### 语音参数

**Speech Rate (语速):**
- `-50%` = 慢速
- `+0%` = 正常速度（推荐）
- `+50%` = 快速
- `+100%` = 最快

**Pitch (音调):**
- `-50Hz` = 低音
- `+0Hz` = 正常音调（推荐）
- `+50Hz` = 高音

## 停止服务器

在终端中按 `Ctrl+C` 停止服务器。

## 自动启动（可选）

### macOS - 使用 launchd

创建 `~/Library/LaunchAgents/com.edge-tts-server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.edge-tts-server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>/path/to/edge-tts-server/server.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

启动服务：
```bash
launchctl load ~/Library/LaunchAgents/com.edge-tts-server.plist
```

## 技术栈

- **edge-tts**: Microsoft Edge TTS Python SDK
- **Flask**: Web 框架
- **Flask-CORS**: CORS 支持
- **Hypercorn**: ASGI 服务器（支持异步）

## 许可证

MIT License

## 支持

如有问题，请查看日志输出或提交 issue。
