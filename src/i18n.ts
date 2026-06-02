import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        explore: "Explore",
        favorites: "Favorites",
        vocab: "Vocab Book",
        history: "History",
        library: "My Library",
        search: "Search lessons...",
        fullscreen: "Enter Fullscreen",
        exitFullscreen: "Exit Fullscreen",
        pullToRefresh: "Pull to Refresh",
        releaseToRefresh: "Release to Refresh",
        refreshing: "Refreshing..."
      },
      explore: {
        recommended: "Recommended for You",
        youtubeNews: "YouTube News",
        startLearning: "Start Learning",
        free: "Free"
      },
      auth: {
        authentication: "Authentication",
        username: "Username",
        password: "Password",
        enterUsername: "Enter username",
        enterPassword: "Enter password",
        login: "Login",
        loggingIn: "Logging in...",
        loginFailed: "Login failed"
      },
      messages: {
        loginHistory: "Please login to view your watch history.",
        loginFavorites: "Please login to view your favorites.",
        loginVocab: "Please login to access the Vocabulary Book.",
        loginLibrary: "Please login to view your personal library and statistics.",
        vipVocab: "Vocabulary Book is exclusively available for VIP members.",
        membersOnly: "Members Only"
      },
      history: {
        title: "Recent History",
        watched: "Watched",
        complete: "Complete"
      },
      favorites: {
        title: "My Favorites",
        videos: "Videos",
        sentences: "Sentences"
      },
      vocab: {
        title: "Vocabulary Book",
        selectAll: "Select All",
        unselectAll: "Unselect All",
        deleteSelected: "Delete Selected",
        notePlaceholder: "Add a note...",
        save: "Save"
      },
      video: {
        highlights: "Highlights",
        checkIn: "Check In",
        checkedIn: "Checked In",
        languageMode: "Language Mode",
        speed: "Speed",
        fontSize: "Font Size",
        subtitleExample: "Example from Subtitle",
        processing: "Processing...",
        favorited: "Favorited",
        favorite: "Favorite",
        saved: "Saved",
        saveToVocab: "Save to Vocab",
        vipContent: "VIP Content",
        vipDesc: "This video is exclusively available for VIP members. Please login with a VIP account to continue learning.",
        loginNow: "Login Now",
        goBack: "Go Back",
        checkInSuccess: "Checked In!",
        checkInSuccessDesc: "Awesome! You've made great progress today. Keep up the learning momentum!",
        continue: "Continue Learning",
        close: "Close",
        show: "Show",
        hide: "Hide",
        bilingual: "Bilingual",
        english: "English",
        chinese: "Chinese",
        repeat: "Repeat",
        loop: "Loop",
        practice: "Practice"
      },
      settings: {
        playbackSettings: "Playback Settings",
        downloadSubtitles: "Download Subtitles",
        hideAnnotations: "Hide Annotations",
        showPhonetics: "Show Phonetics",
        autoVocab: "Auto Vocabulary",
        subtitlesUnderScreen: "Subtitles Under Screen",
        realtimeSubtitles: "Real-time Subtitles",
        subtitleSize: "Subtitle Size",
        sizeSmall: "Small",
        sizeStandard: "Standard",
        sizeMedium: "Medium",
        sizeLarge: "Large",
        hideMask: "Mask Overlay",
        videoCaptions: "Video Captions",
        vocabHighlight: "Vocab Highlight"
      },
      library: {
        vip: "VIP Member",
        standard: "Standard",
        totalStudy: "Total Favorites",
        videosWatched: "Videos Watched",
        vocabBuilt: "Vocab Built",
        perfectDays: "Perfect Days",
        signOut: "Sign Out",
        language: "Language",
        settings: "Settings",
        english: "English",
        chinese: "中文",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        bio: "Passionate about language learning and exploring world cultures. Improving bit by bit every day.",
        joined: "Joined"
      },
      checkin: {
        title: "Check-in Records",
        noVideos: "No check-in records for this day",
        checkedIn: "Checked In"
      },
      practice: {
        title: "Select Practice Mode",
        sentenceTitle: "Sentence Practice",
        sentenceDesc: "Refine every pronunciation. Step-by-step shadowing for each sentence.",
        fullTitle: "Full Challenge",
        fullDesc: "Fluency shadowing test. Uninterrupted reading with comprehensive report analysis.",
        startReading: "Start Reading",
        hideTranslation: "Click to Hide",
        showTranslation: "Click to Show Translation",
        rerecord: "Re-record",
        tapToRecord: "Tap to record",
        tapToStop: "Tap to stop",
        finish: "Finish",
        fullMode: "Full Challenge",
        reportTitle: "Challenge Report",
        performance: "Pronunciation Performance",
        weaknessAnalysis: "Weakness Analysis",
        refine: "Refine",
        retry: "Retry Challenge"
      }
    }
  },
  zh: {
    translation: {
      nav: {
        explore: "探索",
        favorites: "收藏区",
        vocab: "生词本",
        history: "历史记录",
        library: "我的",
        search: "搜索课程...",
        fullscreen: "进入全屏",
        exitFullscreen: "退出全屏",
        pullToRefresh: "下拉刷新",
        releaseToRefresh: "松开刷新",
        refreshing: "刷新中..."
      },
      explore: {
        recommended: "推荐",
        youtubeNews: "YouTube 新闻",
        startLearning: "开始学习",
        free: "免费"
      },
      auth: {
        authentication: "身份认证",
        username: "账号",
        password: "密码",
        enterUsername: "请输入账号",
        enterPassword: "请输入密码",
        login: "登录",
        loggingIn: "正在登录...",
        loginFailed: "登录失败"
      },
      messages: {
        loginHistory: "请登录以查看您的历史记录。",
        loginFavorites: "请登录以查看您的收藏。",
        loginVocab: "请登录以访问生词本。",
        loginLibrary: "请登录以查看您的专属页面与学习统计。",
        vipVocab: "生词本为 VIP 会员专享记录，请开通会员或登录会员账号使用。",
        membersOnly: "会员专属"
      },
      history: {
        title: "最近学习",
        watched: "观看于",
        complete: "已完成"
      },
      favorites: {
        title: "我的收藏",
        videos: "视频",
        sentences: "句子"
      },
      vocab: {
        title: "生词本",
        selectAll: "全选",
        unselectAll: "取消全选",
        deleteSelected: "删除选中项",
        notePlaceholder: "添加笔记...",
        save: "保存"
      },
      video: {
        highlights: "高亮句型",
        checkIn: "打卡",
        checkedIn: "已打卡",
        languageMode: "语言模式",
        speed: "播放速度",
        fontSize: "字体大小",
        subtitleExample: "字幕例句",
        processing: "处理中...",
        favorited: "已收藏",
        favorite: "收藏",
        saved: "已加入生词本",
        saveToVocab: "生词本",
        vipContent: "VIP 专属内容",
        vipDesc: "此视频仅限 VIP 会员观看。请使用 VIP 账号登录以继续学习。",
        loginNow: "立即登录",
        goBack: "返回",
        checkInSuccess: "打卡成功！",
        checkInSuccessDesc: "太棒了！今日的学习目标已经达成，继续保持学习的热情吧！",
        continue: "继续学习",
        close: "关闭",
        show: "显示",
        hide: "隐藏",
        bilingual: "双语",
        english: "英语",
        chinese: "中文",
        repeat: "复读",
        loop: "循环",
        practice: "练习"
      },
      settings: {
        playbackSettings: "播放设置",
        downloadSubtitles: "字幕下载",
        hideAnnotations: "隐藏标注",
        showPhonetics: "全文音标",
        autoVocab: "自动词汇",
        subtitlesUnderScreen: "屏下字幕",
        realtimeSubtitles: "实时字幕",
        subtitleSize: "字幕大小",
        sizeSmall: "小号",
        sizeStandard: "标准",
        sizeMedium: "中号",
        sizeLarge: "大号",
        hideMask: "遮罩板",
        videoCaptions: "视频字幕",
        vocabHighlight: "生词标注"
      },
      library: {
        vip: "VIP会员",
        standard: "普通用户",
        totalStudy: "总收藏",
        videosWatched: "已看视频",
        vocabBuilt: "已记单词",
        perfectDays: "完美打卡",
        signOut: "退出登录",
        language: "语言",
        settings: "设置",
        english: "English",
        chinese: "中文",
        lightMode: "浅色模式",
        darkMode: "深色模式",
        bio: "热爱学习语言，探索世界文化。每天进步一点点。",
        joined: "加入于"
      },
      checkin: {
        title: "打卡记录",
        noVideos: "当天没有打卡记录",
        checkedIn: "已打卡"
      },
      practice: {
        title: "选择练习模式",
        sentenceTitle: "逐句精听",
        sentenceDesc: "精准打磨每个发音。通过听、读、评的单句闭环，不断提升发音细节。",
        fullTitle: "全文挑战",
        fullDesc: "流利度影子跟读测试。不间断跟读原音，最终生成全面的发音报告分析。",
        startReading: "开始朗读",
        hideTranslation: "点击隐藏",
        showTranslation: "点击显示中文",
        rerecord: "重新录音",
        tapToRecord: "点击录音",
        tapToStop: "点击结束录音",
        finish: "完成",
        fullMode: "全文挑战",
        reportTitle: "挑战报告",
        performance: "发音多维表现",
        weaknessAnalysis: "发音攻坚（最低评分）",
        refine: "去精修",
        retry: "重新挑战"
      }
    }
  }
};

// 自定义语言检测器，确保设置被持久化
const languageDetector = new LanguageDetector(null, {
  order: ['localStorage', 'navigator'],
  caches: ['localStorage'],
  lookupLocalStorage: 'linguist-tube-language'
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh'],
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;
