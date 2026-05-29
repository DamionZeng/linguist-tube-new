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
        search: "Search lessons..."
      },
      explore: {
        recommended: "Recommended for You",
        youtubeNews: "YouTube News",
        startLearning: "Start Learning"
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
        goBack: "Go Back"
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
        sizeLarge: "Large"
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
        darkMode: "Dark Mode"
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
        search: "搜索课程..."
      },
      explore: {
        recommended: "推荐",
        youtubeNews: "YouTube 新闻",
        startLearning: "开始学习"
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
        saved: "已加入",
        saveToVocab: "生词本",
        vipContent: "VIP 专属内容",
        vipDesc: "此视频仅限 VIP 会员观看。请使用 VIP 账号登录以继续学习。",
        loginNow: "立即登录",
        goBack: "返回"
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
        sizeLarge: "大号"
      },
      library: {
        vip: "VIP会员",
        standard: "普通用户",
        totalStudy: "总收藏",
        videosWatched: "已看视频",
        vocabBuilt: "已记单词",
        perfectDays: "完美打卡",
        signOut: "退出登录",
        language: "语言要求",
        settings: "设置",
        english: "English",
        chinese: "中文",
        lightMode: "浅色模式",
        darkMode: "深色模式"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;
