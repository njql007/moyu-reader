import { RSSFeed } from './types';

// Using a CORS proxy is essential for a purely frontend RSS reader to access these external domains.
// We use corsproxy.io for better performance and compatibility with images/headers.
export const CORS_PROXY = "https://corsproxy.io/?";

export const FEEDS: RSSFeed[] = [
  {
    id: 'cnbeta',
    name: 'CnBeta',
    url: 'https://www.cnbeta.com.tw/backend.php?rid=1',
    category: 'tech',
    icon: '⚡'
  },
  {
    id: 'ithome',
    name: 'IT之家',
    url: 'https://www.ithome.com/rss/',
    category: 'tech',
    icon: '🏠'
  },
  {
    id: 'landian',
    name: '蓝点网',
    url: 'https://www.landiannews.com/feed',
    category: 'tech',
    icon: '🔷'
  },
  {
    id: 'ifanr',
    name: '爱范儿',
    url: 'https://www.ifanr.com/feed',
    category: 'tech',
    icon: '🍦'
  },
  {
    id: 'sspai',
    name: '少数派',
    url: 'https://sspai.com/feed',
    category: 'tech',
    icon: '🥧'
  },
  {
    id: 'verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    icon: '▲'
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/rss',
    category: 'dev',
    icon: 'Y'
  },
  {
    id: 'v2ex',
    name: 'V2EX',
    url: 'https://www.v2ex.com/index.xml',
    category: 'dev',
    icon: 'V'
  }
];