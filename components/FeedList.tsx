import React, { useEffect, useRef } from 'react';
import { Article, RSSFeed } from '../types';
import { FEEDS, MIXED_FEED_CN } from '../constants';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

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
  hasMore
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { fontSizeLevel } = useTheme();

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

  // Dynamic style generators based on font level
  const getHeaderSize = () => {
    if (fontSizeLevel === 3) return 'text-xl';
    if (fontSizeLevel === 2) return 'text-lg';
    if (fontSizeLevel === 1) return 'text-base';
    return 'text-sm';
  };

  const getItemPadding = () => {
    if (fontSizeLevel >= 3) return 'p-8';
    if (fontSizeLevel === 2) return 'p-6';
    if (fontSizeLevel === 1) return 'p-5';
    return 'p-4';
  };

  const getTitleClass = () => {
    if (fontSizeLevel >= 3) return 'text-2xl leading-tight font-bold';
    if (fontSizeLevel === 2) return 'text-xl leading-snug font-semibold';
    if (fontSizeLevel === 1) return 'text-lg leading-snug font-medium';
    return 'text-base font-medium'; // Default
  };

  const getMetaClass = () => {
    if (fontSizeLevel >= 3) return 'text-lg mb-4';
    if (fontSizeLevel === 2) return 'text-base mb-3';
    if (fontSizeLevel === 1) return 'text-sm mb-2';
    return 'text-xs mb-2'; // Default
  };

  const getSnippetClass = () => {
    if (fontSizeLevel >= 3) return 'text-xl leading-relaxed';
    if (fontSizeLevel === 2) return 'text-lg leading-relaxed';
    if (fontSizeLevel === 1) return 'text-base';
    return 'text-xs'; // Default
  };

  if (!selectedFeed) {
    return (
      <div className={`flex-1 flex items-center justify-center text-muted bg-surface h-full ${fontSizeLevel > 1 ? 'text-xl' : ''}`}>
        Select a feed to start
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full bg-surface transition-all`}>
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-surface sticky top-0 z-10 shrink-0">
        <h2 className={`font-semibold text-primary truncate pr-2 ${getHeaderSize()}`}>{selectedFeed.name}</h2>
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-elevated rounded-full transition-colors shrink-0"
          title="Refresh Feed"
        >
          {isLoading && articles.length === 0 ? (
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
          ) : (
            <RefreshCw className="w-4 h-4 text-muted" />
          )}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && articles.length === 0 ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-elevated rounded w-3/4"></div>
                <div className="h-3 bg-elevated rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="pb-12">
            {articles.map((article) => {
              const isSelected = selectedArticleId === article.guid;
              const date = new Date(article.pubDate);
              const timeString = isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <li key={article.guid}>
                  <button
                    onClick={() => onSelectArticle(article)}
                    className={`w-full text-left border-b border-border transition-colors hover:bg-elevated focus:outline-none ${getItemPadding()} ${isSelected ? 'bg-elevated border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'
                      }`}
                  >
                    <h3 className={`${getTitleClass()} mb-1 ${isSelected && fontSizeLevel === 0 ? 'text-accent' : 'text-primary'
                      } ${fontSizeLevel > 0 ? 'text-primary' : ''} line-clamp-3`}>
                      {selectedFeed?.id === MIXED_FEED_CN.id && article.feedId && (
                        <span className="inline-block mr-2 text-sm align-middle opacity-70" title={FEEDS.find(f => f.id === article.feedId)?.name}>
                          {FEEDS.find(f => f.id === article.feedId)?.icon || '📰'}
                        </span>
                      )}
                      {article.title}
                    </h3>
                    <p className={`${getMetaClass()} text-muted`}>{timeString}</p>
                    <p className={`${getSnippetClass()} text-secondary line-clamp-2`}>
                      {article.contentSnippet}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!isLoading && articles.length === 0 && (
          <div className={`p-8 text-center text-muted ${fontSizeLevel > 1 ? 'text-lg' : ''}`}>
            No articles found.
          </div>
        )}

        {/* Infinite Scroll Loader */}
        {articles.length > 0 && hasMore && (
          <div ref={loadMoreRef} className="p-4 flex justify-center items-center text-muted text-xs">
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
          <div className="p-6 text-center text-muted text-xs border-t border-border">
            End of content
          </div>
        )}
        {/* Spacer for SocialBar */}
        <div className="h-12 shrink-0" />
      </div>

      {/* Footer status */}
      <div className="h-8 border-t border-border bg-surface flex items-center px-4 text-[10px] text-muted justify-between shrink-0">
        <span>Updated: {lastUpdated > 0 ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}</span>
        <span>{articles.length} items</span>
      </div>
    </div>
  );
};