import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { FeedList } from './components/FeedList';
import { ArticleView } from './components/ArticleView';
import { RSSFeed, Article, FeedState } from './types';
import { FEEDS } from './constants';
import { fetchRSSFeed } from './services/rssService';
import { AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [selectedFeed, setSelectedFeed] = useState<RSSFeed | null>(FEEDS[0]); 
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  const [feedCache, setFeedCache] = useState<Record<string, FeedState>>({});

  const loadFeed = useCallback(async (feed: RSSFeed, forceRefresh = false) => {
    const now = Date.now();
    const existing = feedCache[feed.id];
    
    // Cache validity: 5 minutes
    if (!forceRefresh && existing && existing.articles.length > 0 && (now - existing.lastUpdated < 300000)) {
      return;
    }

    setFeedCache(prev => ({
      ...prev,
      [feed.id]: {
        articles: prev[feed.id]?.articles || [],
        isLoading: true,
        error: null,
        lastUpdated: prev[feed.id]?.lastUpdated || 0
      }
    }));

    try {
      const articles = await fetchRSSFeed(feed.url);
      setFeedCache(prev => ({
        ...prev,
        [feed.id]: {
          articles,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        }
      }));
    } catch (error: any) {
      console.error(error);
      setFeedCache(prev => ({
        ...prev,
        [feed.id]: {
          ...prev[feed.id],
          isLoading: false,
          error: error.message || "Failed to load feed"
        }
      }));
    }
  }, [feedCache]);

  useEffect(() => {
    if (selectedFeed) {
      loadFeed(selectedFeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleFeedSelect = (feed: RSSFeed) => {
    setSelectedFeed(feed);
    setSelectedArticle(null);
    loadFeed(feed);
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleRefresh = () => {
    if (selectedFeed) {
      loadFeed(selectedFeed, true);
    }
  };

  const currentFeedState = selectedFeed ? feedCache[selectedFeed.id] || { articles: [], isLoading: true, error: null, lastUpdated: 0 } : null;

  return (
    <div className="flex h-screen w-screen bg-black text-gray-100 overflow-hidden font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Sidebar */}
      <Sidebar 
        selectedFeedId={selectedFeed?.id || null} 
        onSelectFeed={handleFeedSelect} 
      />

      {/* 2. Feed List */}
      <FeedList 
        selectedFeed={selectedFeed}
        articles={currentFeedState?.articles || []}
        isLoading={currentFeedState?.isLoading || false}
        onSelectArticle={handleArticleSelect}
        selectedArticleId={selectedArticle?.guid}
        onRefresh={handleRefresh}
        lastUpdated={currentFeedState?.lastUpdated || 0}
      />

      {/* 3. Article View */}
      <ArticleView article={selectedArticle} />
      
      {/* Error Toast */}
      {currentFeedState?.error && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-red-950/90 text-red-200 px-6 py-3 rounded-full text-sm shadow-2xl z-50 border border-red-800/50 backdrop-blur flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <AlertCircle className="w-4 h-4" />
           <span>{currentFeedState.error}</span>
           <button 
             onClick={handleRefresh}
             className="ml-2 px-2 py-1 bg-red-900/50 hover:bg-red-800 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
           >
             Retry
           </button>
        </div>
      )}
    </div>
  );
};

export default App;