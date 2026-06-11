# 精听模式 (Intensive Listening Mode) 设计文档

**日期**: 2026-06-11

## 概述

在视频播放页面增加"精听模式"，与现有"普通模式"并列。精听模式下，每句字幕自动循环播放 N 遍（默认4遍），前 N-1 遍不显示字幕，最后一遍显示双语字幕，然后自动跳到下一句。

## 组件变更

### 1. VideoLearningPage (`src/pages/VideoLearning/index.tsx`)

新增状态：
- `listeningMode: 'normal' | 'intensive'`，默认 `'normal'`
- `intensiveRepeatCount: number`，默认 `4`

在视频区域与字幕区域之间增加模式切换 UI（分段式控件），两个按钮并排。

传递 `listeningMode` 和 `intensiveRepeatCount` 给 `VideoPlayer`、`useVideoPlayer`、`TranscriptList`。

### 2. useVideoPlayer hook (`src/pages/VideoLearning/hooks/useVideoPlayer.ts`)

新增参数：
- `listeningMode: 'normal' | 'intensive'`
- `intensiveRepeatCount: number`

精听逻辑：
- 在 `isPlaying` 且 `listeningMode === 'intensive'` 时，检测当前 `currentTime` 是否超过当前句的 `endTime`
- 如果超过，根据当前循环次数决定：
  - 未到最后一轮：`seekTo(startTime)` 重新播放，`repeatCount`++
  - 到最后一轮：跳到下一句的 `startTime`，`repeatCount` 归零
- 导出 `intensiveRepeatCurrent` 供外部判断是否显示字幕

### 3. PlaybackSettingsModal (`src/pages/VideoLearning/components/PlaybackSettingsModal.tsx`)

新增 props：
- `intensiveRepeatCount: number`
- `onIntensiveRepeatCountChange: (count: number) => void`

在设置面板中增加"精听重复次数"调节（范围 2-6）。

### 4. VideoPlayer (`src/pages/VideoLearning/components/VideoPlayer.tsx`)

精听模式下：
- 前 N-1 遍强制不显示字幕（覆盖 langMode 为 'none'）
- 最后一遍显示双语字幕

### 5. TranscriptList (`src/pages/VideoLearning/components/TranscriptList.tsx`)

精听模式下：
- 前 N-1 遍：所有字幕不显示（langMode 临时设为 'none'）
- 最后一遍：显示双语

### 6. i18n (`src/i18n.ts`)

新增文案 key：
- `video.intensiveMode`: "精听模式"
- `video.normalMode`: "普通模式"
- `settings.intensiveRepeatCount`: "精听重复次数"

## 数据流

```
VideoLearningPage (listeningMode, intensiveRepeatCount)
  ├─► ModeSwitch UI (两个按钮切换)
  ├─► VideoPlayer (接收 listeningMode, intensiveRepeatCurrent → 控制字幕显示)
  ├─► useVideoPlayer (精听循环逻辑)
  ├─► TranscriptList (接收 listeningMode → 控制字幕显示)
  └─► PlaybackSettingsModal (调节 intensiveRepeatCount)
```
