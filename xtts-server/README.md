# XTTS v2 Server

高质量情感文本转语音 API 服务器，使用 Coqui XTTS v2 模型。

## 特性

- ✅ **情感丰富** - 基于上下文自动添加情感表达
- ✅ **断句准确** - 根据标点符号自然停顿
- ✅ **重音自然** - 自动识别关键词并加强
- ✅ **完全免费** - 开源，无限制使用
- ✅ **多语言支持** - 支持英语、中文、西班牙语等
- ✅ **语音克隆** - 可使用自定义音色（高级功能）

## 安装

### 前置要求

- Python 3.9+
- 2GB+ 磁盘空间（模型下载）
- 推荐：NVIDIA GPU（CPU 也可用，但较慢）

### 1. 安装依赖

```bash
cd xtts-server
pip install -r requirements.txt
```

或使用虚拟环境（推荐）：

```bash
cd xtts-server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 启动服务器

```bash
python server.py
```

**首次启动**：
- 会自动下载 XTTS v2 模型（~2GB）
- 下载时间取决于网速（5-20 分钟）
- 模型会缓存到本地，后续启动秒开

服务器将在 `http://localhost:5001` 启动

## 手机访问配置

### 方法1：局域网访问（推荐）

1. 确保手机和电脑连接到同一个 WiFi
2. 查找电脑的 IP 地址：
   - **macOS**: 系统偏好设置 → 网络 → 查看 IP
   - **Windows**: 命令提示符运行 `ipconfig`
   - **Linux**: 终端运行 `ifconfig` 或 `ip addr`
3. 在手机浏览器访问: `http://<电脑IP>:5001`

## API 使用

### 1. 生成语音

**端点**: `POST /tts`

**请求体**:
```json
{
  "text": "Hello! This is XTTS v2 speaking with emotion and proper emphasis.",
  "voice": "female",
  "language": "en",
  "speed": 1.0
}
```

**参数说明**:
- `text`: 要转换的文本
- `voice`: 音色（female, male, female_emotional, male_deep）
- `language`: 语言代码（en, zh-cn, es, fr, de, etc.）
- `speed`: 语速（0.5 - 2.0，默认 1.0）

**返回**: WAV 音频流

### 2. 获取可用音色

**端点**: `GET /voices`

返回可用音色列表

### 3. 健康检查

**端点**: `GET /health`

检查服务器状态

## 性能优化

### GPU vs CPU

- **GPU（推荐）**:
  - 生成速度：2-4 秒/句
  - 需要 NVIDIA GPU + CUDA

- **CPU**:
  - 生成速度：5-15 秒/句
  - 适合轻度使用

### 内存优化

XTTS v2 模型会占用：
- GPU: ~2GB VRAM
- CPU: ~2GB RAM

如果内存不足，可以减少并发请求数量。

## 音质说明

### XTTS v2 的优势

1. **情感表达**：
   - 疑问句自然上扬
   - 感叹句语气加强
   - 能表达兴奋、平静、疑惑等情绪

2. **断句准确**：
   - 逗号：短停顿
   - 句号：明显停顿
   - 问号/感叹号：情感化停顿

3. **重音自然**：
   - 自动识别重要单词
   - 在关键词处加强语气
   - 避免机械朗读感

### 对比其他方案

| 特性 | Edge TTS | XTTS v2 | ElevenLabs |
|------|----------|---------|------------|
| 情感 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 断句 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 重音 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 速度 | 1s | 2-4s | 1-2s |
| 免费 | ✅ | ✅ | 限额 |

## 故障排除

### 模型下载失败

如果下载中断，删除缓存重试：
```bash
rm -rf ~/.local/share/tts/
python server.py
```

### 端口被占用

修改 `server.py` 最后一行的端口号：
```python
uvicorn.run(app, host="0.0.0.0", port=8888, log_level="info")
```

### GPU 内存不足

降低到 CPU 模式：
```bash
# 在启动前设置环境变量
export CUDA_VISIBLE_DEVICES=""
python server.py
```

### 生成速度慢

- 确认 GPU 正在使用（查看启动日志）
- 减少并发请求
- 考虑升级硬件或使用云服务器

## 高级功能：语音克隆

XTTS v2 支持使用自定义音色：

1. 准备 5-10 秒的清晰人声录音（WAV 格式）
2. 修改 `server.py` 中的 `speaker_wav` 参数
3. 系统会学习该音色并应用到朗读中

## License

MIT License - 完全开源免费使用

基于 Coqui TTS 项目：https://github.com/coqui-ai/TTS
