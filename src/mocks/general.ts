export const MOCK_USERS = [
  { username: 'damion', password: '123456', role: 'user' },
  { username: 'root', password: '123456', role: 'vip' }
];

export const MOCK_CATEGORIES = ["All", "Business", "Daily Life", "Travel", "IELTS", "Slang"];

export const MOCK_CAROUSEL_ITEMS = [
  {
    id: "v1",
    title: "商场购物与试衣",
    subtitle: "Shopping & Fitting",
    desc: "Learn essential vocabulary for trying on clothes at the mall.",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b854d4?auto=format&fit=crop&w=800&q=80",
    tag: "Up Next",
  },
  {
    id: "v2",
    title: "咖啡馆点餐",
    subtitle: "Ordering at a Cafe",
    desc: "Master the common phrases used in a coffee shop.",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
    tag: "New",
  },
  {
    id: "v3",
    title: "求职面试技巧",
    subtitle: "Job Interview Tips",
    desc: "Key phrases and power words to land your dream job.",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    tag: "Featured",
  },
];


export const MOCK_EXPLORE_VIDEOS = [
  { id: 'v1', title: 'Mastering British Phrasal Verbs', duration: '12:45', level: 'Intermediate', thumb: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80', tag: 'British English', isVipOnly: false },
  { id: 'v2', title: 'Coffee Shop Conversations', duration: '08:20', level: 'Beginner', thumb: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80', tag: 'Daily Life', isVipOnly: false },
  { id: 'v3', title: 'Tech Interview Power Words', duration: '15:10', level: 'Advanced', thumb: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80', tag: 'Business', isVipOnly: true },
  { id: 'v4', title: 'Airport & Customs Vocabulary', duration: '10:05', level: 'Beginner', thumb: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80', tag: 'Travel', isVipOnly: true },
  {
    "id": "v5",
    "title": "The_War_Inside_Your_Head__Why_We_Exhaust_Ourselve",
    "duration": "04:27",
    "level": "Intermediate",
    "thumb": "",
    "tag": "Psychology",
    "isVipOnly": false
}
];

export const MOCK_HISTORY = [
  { id: 'v1', title: 'Mastering British Phrasal Verbs', duration: '12:45', level: 'Intermediate', thumb: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80', tag: 'British English', progress: 85, lastWatched: '2 hours ago' },
  { id: 'v2', title: 'Coffee Shop Conversations', duration: '08:20', level: 'Beginner', thumb: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80', tag: 'Daily Life', progress: 30, lastWatched: 'Yesterday' },
];

export const MOCK_VOCAB = [
  { id: 'w1', word: 'get by', phonetic: "/get baɪ/", pos: 'phrasal verb', mean: 'To manage or survive with limited resources.', trans: '勉强生存，维持', added: '2 days ago', example: '"I can get by on just 5 hours of sleep."', exampleTrans: '我只睡5个小时也能勉强应付。' },
  { id: 'w2', word: 'knackered', phonetic: "/'nækəd/", pos: 'adj.', mean: 'Extremely tired; exhausted. (British Informal)', trans: '极度疲倦的，筋疲力尽的', added: 'Oct 12', example: '"I am absolutely knackered after that long trip."', exampleTrans: '那趟长途旅行后我真是累坏了。' },
  { id: 'w3', word: 'try on', phonetic: "/traɪ ɒn/", pos: 'phrasal verb', mean: 'Put on a piece of clothing to see if it fits.', trans: '试穿', added: 'Just now', example: '"Can I try this on before buying it?"', exampleTrans: '买之前我可以试穿一下这个吗？' },
  { id: 'w4', word: 'freshen up', phonetic: "/ˈfreʃ.ən ʌp/", pos: 'phrasal verb', mean: 'To wash and make yourself look clean and tidy.', trans: '梳洗打扮', added: '1 week ago', example: '"We wanted to freshen up a bit before going out."', exampleTrans: '出门前我们想稍加梳洗打扮一下。' },
];

export const MOCK_FAVORITE_SENTENCES = [
  { id: 's1', en: 'They go on your finger.', zh: '它们戴在你的手指上。', videoTitle: '商场购物与试衣', time: '00:02' },
  { id: 's2', en: 'We wanted to freshen up a bit.', zh: '我们想要稍微梳洗打扮一下。', videoTitle: '购物分享与周末晚餐', time: '00:00' },
];
