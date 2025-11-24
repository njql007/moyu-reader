import React, { useState } from 'react';
import { FEEDS } from '../constants';
import { RSSFeed } from '../types';
import { Coffee, Rss } from 'lucide-react';

interface SidebarProps {
  selectedFeedId: string | null;
  onSelectFeed: (feed: RSSFeed) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedFeedId, onSelectFeed }) => {
  const [hoveredFeed, setHoveredFeed] = useState<{ name: string; top: number; left: number } | null>(null);

  return (
    <div className="w-12 md:w-14 lg:w-64 h-full bg-gray-950 border-r border-gray-800 flex flex-col flex-shrink-0 relative z-40">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
             <Coffee className="text-white w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        <span className="ml-3 font-bold text-xl text-white hidden lg:block tracking-tight">Moyu</span>
      </div>

      {/* Feeds List */}
      <div 
        className="flex-1 overflow-y-auto py-3 space-y-1"
        onScroll={() => setHoveredFeed(null)}
      >
        <div className="px-4 mb-2 hidden lg:block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tech Feeds
        </div>
        
        {FEEDS.map((feed) => (
          <button
            key={feed.id}
            onClick={() => onSelectFeed(feed)}
            onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredFeed({
                    name: feed.name,
                    top: rect.top + (rect.height / 2),
                    left: rect.right
                });
            }}
            onMouseLeave={() => setHoveredFeed(null)}
            className={`w-full flex items-center justify-center lg:justify-start px-0 lg:px-4 py-2 transition-all duration-200 relative group
              ${selectedFeedId === feed.id 
                ? 'bg-gray-800/50 text-blue-400 border-r-2 border-blue-500 lg:border-r-0' 
                : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            aria-label={feed.name}
          >
            <span className="text-lg lg:text-xl w-6 text-center flex justify-center">{feed.icon || <Rss className="w-5 h-5"/>}</span>
            <span className="ml-3 font-medium text-sm hidden lg:block truncate">{feed.name}</span>
            
            {/* Active indicator for large screens (border-l style instead of right border) */}
            {selectedFeedId === feed.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 hidden lg:block rounded-r-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Footer / Settings placeholder */}
      <div className="p-4 border-t border-gray-800 lg:flex items-center hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500"></div>
          <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">User</p>
              <p className="text-xs text-gray-500">Pro Slacker</p>
          </div>
      </div>

      {/* Fixed Tooltip Portal - Renders outside the overflow container */}
      {hoveredFeed && (
        <div 
            className="fixed z-50 bg-gray-800 text-white text-xs px-2 py-1.5 rounded shadow-xl border border-gray-700 lg:hidden pointer-events-none whitespace-nowrap animate-in fade-in duration-150"
            style={{ 
                top: hoveredFeed.top, 
                left: hoveredFeed.left + 10,
                transform: 'translateY(-50%)'
            }}
        >
            {hoveredFeed.name}
            {/* Tiny arrow pointing left */}
            <div className="absolute top-1/2 -left-1 w-2 h-2 bg-gray-800 border-l border-b border-gray-700 transform -translate-y-1/2 rotate-45"></div>
        </div>
      )}
    </div>
  );
};