import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { YoutubeTranscript } from "youtube-transcript";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Transcript route
  app.get("/api/transcript", async (req, res) => {
    const videoId = req.query.videoId as string;
    
    if (!videoId) {
      return res.status(400).json({ error: "videoId is required" });
    }

    try {
      // Use youtube-transcript to fetch transcripts
      const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
      
      function formatS(sec: number) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }

      // format to match our frontend interface
      const transcripts = transcriptList.map((item, index) => ({
        id: `t-${index}`,
        startTime: formatS(item.offset / 1000),
        endTime: formatS((item.offset + item.duration) / 1000),
        en: item.text,
        zh: item.text, // Normally we would translate this, but we'll leave it same for now or translate it via API if needed
        isFavorite: false
      }));

      res.json({ transcripts });
    } catch (error: any) {
      console.warn(`Transcript disabled or unavailable for video ${videoId}. Using fallback.`);
      
      // Fallback: return a mock set of transcripts so the timeline functions
      // This is especially for news videos that disable third-party transcript access
      res.json({ transcripts: [
        {
          id: 't-fallback-0',
          startTime: '00:00',
          endTime: '00:05',
          en: '[System] Live subtitles are currently unavailable for this news broadcast.',
          zh: '[系统提示] 该新闻视频的实时字幕不可用或被 YouTube 设定为禁止抓取。',
          isFavorite: false
        },
        {
          id: 't-fallback-1',
          startTime: '00:05',
          endTime: '00:10',
          en: '[System] Language Reactor fetches this via Chrome Extension native environment.',
          zh: '[系统提示] Language Reactor 插件是通过浏览器原生环境强行获取/劫持该数据的。',
          isFavorite: false
        },
        {
          id: 't-fallback-2',
          startTime: '00:10',
          endTime: '00:20',
          en: '[System] We are rendering a fallback UI here so you can test the video player interactions.',
          zh: '[系统提示] 我们在此渲染了一段后备字幕，以便您测试播放器的时间轴交互及其它功能。',
          isFavorite: false
        },
        {
          id: 't-fallback-3',
          startTime: '00:20',
          endTime: '99:59',
          en: '[System] Continue watching the video...',
          zh: '[系统提示] 您可以继续观看该视频...',
          isFavorite: false
        }
      ] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support React Router HTML5 history
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
