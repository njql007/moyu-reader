import React from 'react';
import { Article, RSSFeed } from '../types';
import { Loader2, RefreshCw } from 'lucide-react';

interface FeedListProps {
  selectedFeed: RSSFeed | null;
  articles: Article[];
  isLoading: boolean;
  onSelectArticle: (article: Article) => void;
  selectedArticleId?: string;
  onRefresh: () => void;
  lastUpdated: number;
}

export const FeedList: React.FC<FeedListProps> = ({ 
  selectedFeed, 
  articles, 
  isLoading, 
  onSelectArticle, 
  selectedArticleId,
  onRefresh,
  lastUpdated
}) => {
  if (!selectedFeed) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-900 border-r border-gray-800 h-full">
        Select a feed to start
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full md:w-80 lg:w-96 bg-gray-900 border-r border-gray-800 flex-shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-850 sticky top-0 z-10">
        <h2 className="font-semibold text-gray-200 truncate">{selectedFeed.name}</h2>
        <button 
          onClick={onRefresh} 
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          title="Refresh Feed"
        >
          {isLoading ? (
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
          <ul>
            {articles.map((article) => {
                const isSelected = selectedArticleId === article.guid;
                const date = new Date(article.pubDate);
                const timeString = isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

                return (
                  <li key={article.guid}>
                    <button
                      onClick={() => onSelectArticle(article)}
                      className={`w-full text-left p-4 border-b border-gray-800 transition-colors hover:bg-gray-800 focus:outline-none ${
                        isSelected ? 'bg-gray-800 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <h3 className={`font-medium mb-1 line-clamp-2 ${isSelected ? 'text-blue-400' : 'text-gray-200'}`}>
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{timeString}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {article.contentSnippet}
                      </p>
                    </button>
                  </li>
                );
            })}
          </ul>
        )}
        
        {!isLoading && articles.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No articles found.
          </div>
        )}
      </div>
      
       {/* Footer status */}
       <div className="h-8 border-t border-gray-800 bg-gray-900 flex items-center px-4 text-[10px] text-gray-600">
         Updated: {lastUpdated > 0 ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
       </div>
    </div>
  );
};