export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  icon?: string;
  category: 'tech' | 'news' | 'dev';
}

export interface Article {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  author?: string;
  content: string; // The full content or description
  contentSnippet?: string;
  categories?: string[];
}

export interface FeedState {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  page: number;
  hasMore: boolean;
}