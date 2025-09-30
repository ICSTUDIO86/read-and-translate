# Edge TTS Server

完全免费的高质量文本转语音 API 服务器，使用微软 Edge 的 TTS 引擎。

## 特性

- ✅ **完全免费** - 无需 API key，无限制使用
- ✅ **高音质** - Azure TTS 同级别的语音质量
- ✅ **快速响应** - 1-2秒即可开始播放
- ✅ **多语言支持** - 支持中文、英文等100+种语音
- ✅ **简单部署** - 一键启动，即用即开

## 安装

### 1. 安装 Python 依赖

```bash
cd tts-server
pip install -r requirements.txt
```

或使用虚拟环境（推荐）：

```bash
cd tts-server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 启动服务器

```bash
python server.py
```

服务器将在 `http://localhost:5000` 启动

## 手机访问配置

### 方法1：局域网访问（推荐）

1. 确保手机和电脑连接到同一个 WiFi
2. 查找电脑的 IP 地址：
   - **macOS**: 系统偏好设置 → 网络 → 查看 IP
   - **Windows**: 命令提示符运行 `ipconfig`
   - **Linux**: 终端运行 `ifconfig` 或 `ip addr`
3. 在手机浏览器访问: `http://<电脑IP>:5000`

### 方法2：手机上直接运行（Android）

使用 Termux 在 Android 手机上运行：

```bash
# 在 Termux 中
pkg install python
pip install -r requirements.txt
python server.py
```

然后访问 `http://localhost:5000`

## API 使用

### 1. 生成语音

**端点**: `POST /tts`

**请求体**:
```json
{
  "text": "你好，世界！",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": "+0%",
  "pitch": "+0Hz"
}
```

**参数说明**:
- `text`: 要转换的文本
- `voice`: 音色ID（见下方推荐音色）
- `rate`: 语速调整 (-50% 到 +100%)
- `pitch`: 音调调整 (例如: "+0Hz", "-10Hz")

**返回**: MP3 音频流

### 2. 获取可用音色

**端点**: `GET /voices`

返回推荐的音色列表

### 3. 健康检查

**端点**: `GET /health`

检查服务器状态

## 推荐音色

### 中文（简体）
- `zh-CN-XiaoxiaoNeural` - 晓晓 (女声，温柔)
- `zh-CN-YunxiNeural` - 云希 (男声，沉稳)
- `zh-CN-XiaoyiNeural` - 晓伊 (女声，活泼)

### 英文（美式）
- `en-US-AriaNeural` - Aria (女声，清晰)
- `en-US-GuyNeural` - Guy (男声，专业)
- `en-US-JennyNeural` - Jenny (女声，亲切)

### 英文（英式）
- `en-GB-SoniaNeural` - Sonia (女声)
- `en-GB-RyanNeural` - Ryan (男声)

## 测试 API

使用 curl 测试：

```bash
curl -X POST http://localhost:5000/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello World","voice":"en-US-AriaNeural"}' \
  --output test.mp3
```

## 故障排除

### 端口被占用

如果 5000 端口被占用，修改 `server.py` 最后一行的端口号：

```python
uvicorn.run(app, host="0.0.0.0", port=8888, log_level="info")
```

### 网络无法访问

确保防火墙允许端口访问：

- **macOS**: 系统偏好设置 → 安全性与隐私 → 防火墙
- **Windows**: 控制面板 → Windows Defender 防火墙

### Python 版本要求

需要 Python 3.8 或更高版本

## 性能优化

- 服务器会自动缓存常用请求
- 支持并发请求处理
- 音频以流式传输，减少等待时间

## License

MIT License - 完全开源免费使用
