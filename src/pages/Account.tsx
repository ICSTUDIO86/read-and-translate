import { useState, useEffect, useRef } from 'react';
import { User, Settings, Heart, Download, HelpCircle, LogOut, Languages, Volume2, Upload, Save, Database } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getTranslationConfig, saveTranslationConfig } from '@/lib/translation';
import { getTTSConfig, saveTTSConfig, TTSEngine } from '@/lib/ttsConfig';
import { checkServerHealth, getAvailableVoices, VoiceOption } from '@/lib/edgeTTS';
import { checkXTTSServerHealth, getAvailableXTTSVoices } from '@/lib/xttsTTS';
import { downloadAllData, importFromFile, exportAllData } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const menuItems = [
  { icon: Settings, label: 'Settings', description: 'App preferences' },
  { icon: Heart, label: 'Favorites', description: 'Your liked books' },
  { icon: Download, label: 'Downloads', description: 'Offline content' },
  { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance' },
];

const Account = () => {
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [translationConfig, setTranslationConfig] = useState(getTranslationConfig());

  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [ttsConfig, setTTSConfig] = useState(getTTSConfig());
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Record<string, VoiceOption[]>>({});

  const handleSaveTranslationConfig = () => {
    saveTranslationConfig(translationConfig);
    toast.success('Translation settings saved');
    setShowTranslationSettings(false);
  };

  const handleSaveTTSConfig = async () => {
    saveTTSConfig(ttsConfig);
    toast.success('TTS settings saved');
    setShowTTSSettings(false);
  };

  const handleTestEdgeTTS = async () => {
    const healthy = await checkServerHealth(ttsConfig.edgeTTSServerUrl);
    setIsServerHealthy(healthy);
    if (healthy) {
      toast.success('Edge TTS server is running!');
      // Fetch available voices
      const voices = await getAvailableVoices(ttsConfig.edgeTTSServerUrl);
      setAvailableVoices(voices);
    } else {
      toast.error('Cannot connect to Edge TTS server. Make sure it is running.');
    }
  };

  const handleTestXTTS = async () => {
    const healthy = await checkXTTSServerHealth(ttsConfig.xttsServerUrl);
    setIsServerHealthy(healthy);
    if (healthy) {
      toast.success('XTTS v2 server is running!');
    } else {
      toast.error('Cannot connect to XTTS server. Make sure it is running.');
    }
  };

  useEffect(() => {
    if (showTTSSettings && ttsConfig.engine === 'edge-tts') {
      handleTestEdgeTTS();
    } else if (showTTSSettings && ttsConfig.engine === 'xtts') {
      handleTestXTTS();
    }
  }, [showTTSSettings]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Reader</h1>
          <p className="text-sm text-muted-foreground">reader@bookapp.com</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground mb-1">12</p>
            <p className="text-xs text-muted-foreground">Books Read</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground mb-1">48h</p>
            <p className="text-xs text-muted-foreground">Audio Time</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground mb-1">6</p>
            <p className="text-xs text-muted-foreground">Favorites</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {/* TTS Settings */}
          <button
            onClick={() => setShowTTSSettings(true)}
            className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 hover:bg-card/80 transition-colors shadow-sm"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <Volume2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Text-to-Speech</p>
              <p className="text-xs text-muted-foreground">Configure voice and speech settings</p>
            </div>
          </button>

          {/* Translation Settings */}
          <button
            onClick={() => setShowTranslationSettings(true)}
            className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 hover:bg-card/80 transition-colors shadow-sm"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <Languages className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Translation API</p>
              <p className="text-xs text-muted-foreground">Configure translation service</p>
            </div>
          </button>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 hover:bg-card/80 transition-colors shadow-sm"
              >
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Translation Settings Dialog */}
        <Dialog open={showTranslationSettings} onOpenChange={setShowTranslationSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Translation API Settings</DialogTitle>
              <DialogDescription>
                Configure your translation API to enable book translation features
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* API Provider */}
              <div>
                <Label htmlFor="provider">Translation Provider (Open Source)</Label>
                <select
                  id="provider"
                  value={translationConfig.provider}
                  onChange={(e) => setTranslationConfig({
                    ...translationConfig,
                    provider: e.target.value as 'libretranslate' | 'huggingface'
                  })}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="huggingface">Hugging Face NLLB (Recommended - Meta's Best Model)</option>
                  <option value="libretranslate">LibreTranslate (Self-hosted or API Key Required)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {translationConfig.provider === 'libretranslate'
                    ? 'Requires API key from portal.libretranslate.com or self-hosted instance'
                    : 'Meta\'s No Language Left Behind model - best quality. Get FREE API key from huggingface.co'}
                </p>
              </div>

              {/* Server URL for LibreTranslate */}
              {translationConfig.provider === 'libretranslate' && (
                <div>
                  <Label htmlFor="serverUrl">LibreTranslate Server URL</Label>
                  <Input
                    id="serverUrl"
                    type="text"
                    placeholder="https://libretranslate.com"
                    value={translationConfig.serverUrl || ''}
                    onChange={(e) => setTranslationConfig({
                      ...translationConfig,
                      serverUrl: e.target.value
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: https://libretranslate.com (requires API key). Or enter your self-hosted instance URL.
                  </p>
                </div>
              )}

              {/* API Key */}
              <div>
                <Label htmlFor="apiKey">
                  API Key (Required)
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={translationConfig.provider === 'libretranslate'
                    ? 'Get from portal.libretranslate.com'
                    : 'hf_...'
                  }
                  value={translationConfig.apiKey}
                  onChange={(e) => setTranslationConfig({
                    ...translationConfig,
                    apiKey: e.target.value
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {translationConfig.provider === 'libretranslate'
                    ? 'Register at portal.libretranslate.com or use your self-hosted instance'
                    : 'Get your FREE API key from huggingface.co/settings/tokens (no credit card required)'}
                </p>
              </div>

              {/* Target Language */}
              <div>
                <Label htmlFor="targetLang">Target Language</Label>
                <select
                  id="targetLang"
                  value={translationConfig.targetLanguage}
                  onChange={(e) => setTranslationConfig({
                    ...translationConfig,
                    targetLanguage: e.target.value
                  })}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="zh">Chinese (Simplified)</option>
                  <option value="zh-TW">Chinese (Traditional)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTranslationSettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTranslationConfig}>
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TTS Settings Dialog */}
        <Dialog open={showTTSSettings} onOpenChange={setShowTTSSettings}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Text-to-Speech Settings</DialogTitle>
              <DialogDescription>
                Configure your preferred TTS engine and voice settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* TTS Engine Selection */}
              <div>
                <Label htmlFor="ttsEngine">TTS Engine</Label>
                <select
                  id="ttsEngine"
                  value={ttsConfig.engine}
                  onChange={(e) => setTTSConfig({
                    ...ttsConfig,
                    engine: e.target.value as TTSEngine
                  })}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="web-speech">Web Speech API (Built-in, Free)</option>
                  <option value="edge-tts">Edge TTS (High Quality, Free)</option>
                  <option value="xtts">XTTS v2 (Best Quality, Emotional, Free)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {ttsConfig.engine === 'web-speech'
                    ? 'Uses your browser\'s built-in text-to-speech. Works offline, no setup required.'
                    : ttsConfig.engine === 'edge-tts'
                    ? 'Microsoft Edge TTS - Superior quality. Requires local server running.'
                    : 'XTTS v2 - Emotional speech with natural pacing. Best for English reading.'}
                </p>
              </div>

              {/* Edge TTS Settings */}
              {ttsConfig.engine === 'edge-tts' && (
                <>
                  {/* Server URL */}
                  <div>
                    <Label htmlFor="edgeTTSServerUrl">Edge TTS Server URL</Label>
                    <Input
                      id="edgeTTSServerUrl"
                      type="text"
                      placeholder="http://localhost:5000"
                      value={ttsConfig.edgeTTSServerUrl}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        edgeTTSServerUrl: e.target.value
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: http://localhost:5000 (for mobile: http://YOUR-COMPUTER-IP:5000)
                    </p>
                    {isServerHealthy !== null && (
                      <p className={`text-xs mt-1 ${isServerHealthy ? 'text-green-600' : 'text-red-600'}`}>
                        {isServerHealthy ? '✓ Server is running' : '✗ Server not accessible'}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleTestEdgeTTS}
                    >
                      Test Connection
                    </Button>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <Label htmlFor="edgeTTSVoice">Voice</Label>
                    <select
                      id="edgeTTSVoice"
                      value={ttsConfig.edgeTTSVoice}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        edgeTTSVoice: e.target.value
                      })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <optgroup label="Chinese (Simplified)">
                        <option value="zh-CN-XiaoxiaoNeural">Xiaoxiao (Female, Gentle)</option>
                        <option value="zh-CN-YunxiNeural">Yunxi (Male, Calm)</option>
                        <option value="zh-CN-XiaoyiNeural">Xiaoyi (Female, Lively)</option>
                      </optgroup>
                      <optgroup label="English (US)">
                        <option value="en-US-AriaNeural">Aria (Female, Clear)</option>
                        <option value="en-US-GuyNeural">Guy (Male, Professional)</option>
                        <option value="en-US-JennyNeural">Jenny (Female, Friendly)</option>
                      </optgroup>
                      <optgroup label="English (UK)">
                        <option value="en-GB-SoniaNeural">Sonia (Female)</option>
                        <option value="en-GB-RyanNeural">Ryan (Male)</option>
                      </optgroup>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Voice will automatically switch based on text language
                    </p>
                  </div>

                  {/* Speech Rate */}
                  <div>
                    <Label htmlFor="edgeTTSRate">Speech Rate</Label>
                    <select
                      id="edgeTTSRate"
                      value={ttsConfig.edgeTTSRate}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        edgeTTSRate: e.target.value
                      })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="-50%">0.5x (Very Slow)</option>
                      <option value="-25%">0.75x (Slow)</option>
                      <option value="+0%">1.0x (Normal)</option>
                      <option value="+25%">1.25x (Fast)</option>
                      <option value="+50%">1.5x (Very Fast)</option>
                      <option value="+100%">2.0x (Maximum)</option>
                    </select>
                  </div>
                </>
              )}

              {/* XTTS v2 Settings */}
              {ttsConfig.engine === 'xtts' && (
                <>
                  {/* Server URL */}
                  <div>
                    <Label htmlFor="xttsServerUrl">XTTS Server URL</Label>
                    <Input
                      id="xttsServerUrl"
                      type="text"
                      placeholder="http://localhost:5001"
                      value={ttsConfig.xttsServerUrl}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        xttsServerUrl: e.target.value
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: http://localhost:5001 (for mobile: http://YOUR-COMPUTER-IP:5001)
                    </p>
                    {isServerHealthy !== null && (
                      <p className={`text-xs mt-1 ${isServerHealthy ? 'text-green-600' : 'text-red-600'}`}>
                        {isServerHealthy ? '✓ Server is running' : '✗ Server not accessible'}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleTestXTTS}
                    >
                      Test Connection
                    </Button>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <Label htmlFor="xttsVoice">Voice Style</Label>
                    <select
                      id="xttsVoice"
                      value={ttsConfig.xttsVoice}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        xttsVoice: e.target.value
                      })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="female">Female - Warm & Expressive</option>
                      <option value="male">Male - Calm & Professional</option>
                      <option value="female_emotional">Female - Highly Expressive</option>
                      <option value="male_deep">Male - Deep & Authoritative</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      XTTS v2 automatically adds emotion and natural pacing
                    </p>
                  </div>

                  {/* Speech Speed */}
                  <div>
                    <Label htmlFor="xttsSpeed">Speech Speed</Label>
                    <select
                      id="xttsSpeed"
                      value={ttsConfig.xttsSpeed}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        xttsSpeed: parseFloat(e.target.value)
                      })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="0.5">0.5x (Very Slow)</option>
                      <option value="0.75">0.75x (Slow)</option>
                      <option value="1.0">1.0x (Normal)</option>
                      <option value="1.25">1.25x (Fast)</option>
                      <option value="1.5">1.5x (Very Fast)</option>
                      <option value="2.0">2.0x (Maximum)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Web Speech Settings */}
              {ttsConfig.engine === 'web-speech' && (
                <>
                  <div>
                    <Label htmlFor="webSpeechRate">Speech Rate</Label>
                    <select
                      id="webSpeechRate"
                      value={ttsConfig.webSpeechRate}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        webSpeechRate: parseFloat(e.target.value)
                      })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="0.5">0.5x (Very Slow)</option>
                      <option value="0.75">0.75x (Slow)</option>
                      <option value="1.0">1.0x (Normal)</option>
                      <option value="1.25">1.25x (Fast)</option>
                      <option value="1.5">1.5x (Very Fast)</option>
                      <option value="2.0">2.0x (Maximum)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="webSpeechPitch">Pitch</Label>
                    <select
                      id="webSpeechPitch"
                      value={ttsConfig.webSpeechPitch}
                      onChange={(e) => setTTSConfig({
                        ...ttsConfig,
                        webSpeechPitch: parseFloat(e.target.value)
                      })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="0.5">Low</option>
                      <option value="0.75">Slightly Low</option>
                      <option value="1.0">Normal</option>
                      <option value="1.25">Slightly High</option>
                      <option value="1.5">High</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTTSSettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTTSConfig}>
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Data Sync Section */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Sync
            </CardTitle>
            <CardDescription>
              Export and import your books, reading progress, and settings to sync across devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              <p className="text-muted-foreground">
                <strong>Why sync?</strong> Your books are stored locally in your browser.
                Use this feature to transfer data between devices or backup your library.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Export your data on one device</li>
                <li>Import it on another device</li>
                <li>Works across computers, phones, and tablets</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => {
                  try {
                    const data = exportAllData();
                    downloadAllData();
                    toast.success(`Exported ${data.books.length} books successfully!`);
                  } catch (error) {
                    toast.error('Failed to export data');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      try {
                        await importFromFile(file, 'merge');
                        toast.success('Data imported successfully! Refresh the page to see your books.');
                        setTimeout(() => window.location.reload(), 2000);
                      } catch (error) {
                        toast.error('Failed to import data. Please check the file format.');
                      }
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Import mode: Merge (keeps existing books, adds new ones)
            </p>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button variant="outline" className="w-full" size="lg">
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Account;
