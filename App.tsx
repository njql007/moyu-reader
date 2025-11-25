import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { FeedList } from './components/FeedList';
import { ArticleView } from './components/ArticleView';
import { RSSFeed, Article, FeedState } from './types';
import { FEEDS } from './constants';
import { fetchRSSFeed } from './services/rssService';
import { AlertCircle, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [selectedFeed, setSelectedFeed] = useState<RSSFeed | null>(FEEDS[0]); 
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSeniorMode, setIsSeniorMode] = useState(false);
  
  const [feedCache, setFeedCache] = useState<Record<string, FeedState>>({});

  const loadFeed = useCallback(async (feed: RSSFeed, forceRefresh = false, pageToLoad = 1) => {
    const now = Date.now();
    const existing = feedCache[feed.id];
    
    // Cache validity logic only for page 1.
    if (pageToLoad === 1 && !forceRefresh && existing && existing.articles.length > 0 && (now - existing.lastUpdated < 300000)) {
      return;
    }

    setFeedCache(prev => ({
      ...prev,
      [feed.id]: {
        articles: prev[feed.id]?.articles || [],
        isLoading: true,
        error: null, // Reset error on new load
        lastUpdated: prev[feed.id]?.lastUpdated || 0,
        page: pageToLoad,
        hasMore: prev[feed.id]?.hasMore ?? true 
      }
    }));

    try {
      const fetchedArticles = await fetchRSSFeed(feed, pageToLoad);
      
      setFeedCache(prev => {
        const current = prev[feed.id];
        // If it's page 1, replace. If page > 1, append.
        const currentArticles = pageToLoad === 1 ? [] : (current.articles || []);
        
        // Deduplication
        const existingGuids = new Set(currentArticles.map(a => a.guid));
        const newArticles = fetchedArticles.filter(a => !existingGuids.has(a.guid));
        
        // If we got 0 new articles (either empty response or all duplicates), we stop pagination.
        const hasMore = newArticles.length > 0 && fetchedArticles.length > 0;

        return {
          ...prev,
          [feed.id]: {
            articles: [...currentArticles, ...newArticles],
            isLoading: false,
            error: null,
            lastUpdated: Date.now(),
            page: pageToLoad,
            hasMore: hasMore
          }
        };
      });
    } catch (error: any) {
      console.error("LoadFeed Error:", error);
      
      setFeedCache(prev => {
         // If error happens on Page 1, it's a critical feed error.
         // If error happens on Page > 1, it's just "end of stream" or "hiccup", so we just stop loading.
         const isPaginationError = pageToLoad > 1;
         
         return {
            ...prev,
            [feed.id]: {
                ...prev[feed.id],
                isLoading: false,
                // Only set the error message if it's the first page.
                // For pagination, we silence the error and just stop "hasMore".
                error: isPaginationError ? null : (error.message || "Failed to load feed"),
                hasMore: isPaginationError ? false : prev[feed.id].hasMore
            }
         };
      });
    }
  }, [feedCache]);

  useEffect(() => {
    if (selectedFeed) {
      // If never loaded, load page 1
      if (!feedCache[selectedFeed.id]) {
          loadFeed(selectedFeed, false, 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleFeedSelect = (feed: RSSFeed) => {
    setSelectedFeed(feed);
    setSelectedArticle(null);
    if (!feedCache[feed.id]) {
        loadFeed(feed, false, 1);
    }
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleRefresh = () => {
    if (selectedFeed) {
      loadFeed(selectedFeed, true, 1);
    }
  };

  const handleLoadMore = () => {
      if (selectedFeed) {
          const currentState = feedCache[selectedFeed.id];
          // Prevent double loading
          if (!currentState.isLoading && currentState.hasMore) {
              loadFeed(selectedFeed, false, currentState.page + 1);
          }
      }
  };

  const currentFeedState = selectedFeed ? feedCache[selectedFeed.id] || { articles: [], isLoading: true, error: null, lastUpdated: 0, page: 1, hasMore: true } : null;

  return (
    <div className="flex h-screen w-screen bg-black text-gray-100 overflow-hidden font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200 relative">
      {/* 1. Sidebar - Always visible in DOM */}
      <div className="flex-shrink-0 h-full hidden md:block z-20">
        <Sidebar 
            selectedFeedId={selectedFeed?.id || null} 
            onSelectFeed={handleFeedSelect} 
            isSeniorMode={isSeniorMode}
            onToggleSeniorMode={() => setIsSeniorMode(!isSeniorMode)}
        />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="flex-shrink-0 h-full md:hidden z-0">
         <Sidebar 
            selectedFeedId={selectedFeed?.id || null} 
            onSelectFeed={handleFeedSelect} 
            isSeniorMode={isSeniorMode}
            onToggleSeniorMode={() => setIsSeniorMode(!isSeniorMode)}
        />
      </div>

      {/* 2. Feed List - Always visible in DOM, covered by Article on mobile */}
      <div className="h-full z-10 flex-1 md:flex-none md:w-96 min-w-0 border-r border-gray-800 bg-gray-900">
        <FeedList 
            selectedFeed={selectedFeed}
            articles={currentFeedState?.articles || []}
            isLoading={currentFeedState?.isLoading || false}
            onSelectArticle={handleArticleSelect}
            selectedArticleId={selectedArticle?.guid}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
            lastUpdated={currentFeedState?.lastUpdated || 0}
            hasMore={currentFeedState?.hasMore ?? false}
            isSeniorMode={isSeniorMode}
        />
      </div>

      {/* 3. Article View - Slide Over on Mobile, Static on Desktop */}
      <div 
        className={`
            fixed inset-0 z-50 flex
            transition-transform duration-300 ease-out will-change-transform
            ${selectedArticle ? 'translate-x-0' : 'translate-x-full'}
            md:static md:translate-x-0 md:flex-1 md:inset-auto md:w-full
        `}
      >
        {/* Mobile: The "Left Edge" Back Button Area (Blurred Strip) */}
        <button 
            className="w-12 h-full bg-black/60 backdrop-blur-md md:hidden flex-shrink-0 cursor-pointer 
                       flex items-center justify-center group border-r border-white/10 active:bg-black/80 transition-all outline-none"
            onClick={() => setSelectedArticle(null)}
            aria-label="Back to list"
        >
             <div className="bg-white/10 p-2 rounded-full group-active:scale-90 transition-transform shadow-lg border border-white/5">
                <ChevronLeft className="w-5 h-5 text-gray-200 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
             </div>
        </button>

        {/* The Article Content Panel */}
        <div className="flex-1 h-full bg-gray-950 w-full md:w-auto shadow-2xl md:shadow-none border-l border-gray-800 md:border-l-0 overflow-hidden relative">
            <ArticleView 
                article={selectedArticle} 
                onBack={() => setSelectedArticle(null)}
                isSeniorMode={isSeniorMode}
            />
            
            {/* Mobile Visual Cue: A subtle shadow on the left edge of the content panel */}
            <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/20 to-transparent md:hidden pointer-events-none"></div>
        </div>
      </div>
      
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