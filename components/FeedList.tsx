import React, { useEffect, useRef } from 'react';
import { Article, RSSFeed } from '../types';
import { Loader2, RefreshCw, ChevronDown } from 'lucide-react';

interface FeedListProps {
  selectedFeed: RSSFeed | null;
  articles: Article[];
  isLoading: boolean;
  onSelectArticle: (article: Article) => void;
  selectedArticleId?: string;
  onRefresh: () => void;
  onLoadMore: () => void;
  lastUpdated: number;
  hasMore: boolean;
  isSeniorMode: boolean;
}

export const FeedList: React.FC<FeedListProps> = ({ 
  selectedFeed, 
  articles, 
  isLoading, 
  onSelectArticle, 
  selectedArticleId,
  onRefresh,
  onLoadMore,
  lastUpdated,
  hasMore,
  isSeniorMode
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (!selectedFeed) {
    return (
      <div className={`flex-1 flex items-center justify-center text-gray-500 bg-gray-900 border-r border-gray-800 h-full ${isSeniorMode ? 'text-xl' : ''}`}>
        Select a feed to start
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full md:w-80 lg:w-96 bg-gray-900 border-r border-gray-800 transition-all`}>
      {/* Header */}
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-850 sticky top-0 z-10 shrink-0">
        <h2 className={`font-semibold text-gray-200 truncate pr-2 ${isSeniorMode ? 'text-lg' : ''}`}>{selectedFeed.name}</h2>
        <button 
          onClick={onRefresh} 
          className="p-2 hover:bg-gray-700 rounded-full transition-colors shrink-0"
          title="Refresh Feed"
        >
          {isLoading && articles.length === 0 ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : (
            <RefreshCw className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && articles.length === 0 ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="pb-4">
            {articles.map((article) => {
                const isSelected = selectedArticleId === article.guid;
                const date = new Date(article.pubDate);
                const timeString = isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

                return (
                  <li key={article.guid}>
                    <button
                      onClick={() => onSelectArticle(article)}
                      className={`w-full text-left border-b border-gray-800 transition-colors hover:bg-gray-800 focus:outline-none ${
                        isSeniorMode ? 'p-6' : 'p-4'
                      } ${
                        isSelected ? 'bg-gray-800 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <h3 className={`font-medium mb-1 ${
                          isSeniorMode 
                            ? 'text-xl leading-snug text-gray-100 line-clamp-3' 
                            : 'line-clamp-2 text-gray-200'
                          } ${isSelected && !isSeniorMode ? 'text-blue-400' : ''}`}>
                        {article.title}
                      </h3>
                      <p className={`${isSeniorMode ? 'text-sm mb-3 text-gray-400' : 'text-xs text-gray-500 mb-2'}`}>{timeString}</p>
                      <p className={`${isSeniorMode ? 'text-base text-gray-300' : 'text-xs text-gray-400'} line-clamp-2`}>
                        {article.contentSnippet}
                      </p>
                    </button>
                  </li>
                );
            })}
          </ul>
        )}
        
        {!isLoading && articles.length === 0 && (
          <div className={`p-8 text-center text-gray-500 ${isSeniorMode ? 'text-lg' : ''}`}>
            No articles found.
          </div>
        )}

        {/* Infinite Scroll Loader */}
        {articles.length > 0 && hasMore && (
           <div ref={loadMoreRef} className="p-4 flex justify-center items-center text-gray-500 text-xs">
              {isLoading ? (
                  <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading more...
                  </>
              ) : (
                  <span className="opacity-0">Load More trigger</span>
              )}
           </div>
        )}
        
        {articles.length > 0 && !hasMore && (
            <div className="p-6 text-center text-gray-600 text-xs border-t border-gray-800/50">
                End of content
            </div>
        )}
      </div>
      
       {/* Footer status */}
       <div className="h-8 border-t border-gray-800 bg-gray-900 flex items-center px-4 text-[10px] text-gray-600 justify-between shrink-0">
         <span>Updated: {lastUpdated > 0 ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}</span>
         <span>{articles.length} items</span>
       </div>
    </div>
  );
};