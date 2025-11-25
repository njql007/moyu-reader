import React, { useState } from 'react';
import { FEEDS } from '../constants';
import { RSSFeed } from '../types';
import { Coffee, Rss, Glasses } from 'lucide-react';

interface SidebarProps {
  selectedFeedId: string | null;
  onSelectFeed: (feed: RSSFeed) => void;
  isSeniorMode: boolean;
  onToggleSeniorMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedFeedId, onSelectFeed, isSeniorMode, onToggleSeniorMode }) => {
  const [hoveredFeed, setHoveredFeed] = useState<{ name: string; top: number; left: number } | null>(null);

  return (
    <div className="w-12 md:w-14 lg:w-64 h-full bg-gray-950 border-r border-gray-800 flex flex-col flex-shrink-0 relative z-40">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800 flex-shrink-0">
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
             <Coffee className="text-white w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        <span className={`ml-3 font-bold text-white hidden lg:block tracking-tight ${isSeniorMode ? 'text-2xl' : 'text-xl'}`}>Moyu</span>
      </div>

      {/* Feeds List */}
      <div 
        className="flex-1 overflow-y-auto py-3 space-y-1"
        onScroll={() => setHoveredFeed(null)}
      >
        <div className={`px-4 mb-2 hidden lg:block font-semibold text-gray-500 uppercase tracking-wider ${isSeniorMode ? 'text-sm' : 'text-xs'}`}>
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
            <span className={`ml-3 font-medium hidden lg:block truncate ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>{feed.name}</span>
            
            {/* Active indicator for large screens (border-l style instead of right border) */}
            {selectedFeedId === feed.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 hidden lg:block rounded-r-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Senior Mode Toggle (Bottom) */}
      <div className="border-t border-gray-800 bg-gray-950 flex-shrink-0">
        <button
          onClick={onToggleSeniorMode}
          className={`w-full flex items-center justify-center lg:justify-between px-0 lg:px-6 py-4 transition-colors duration-200 outline-none
            ${isSeniorMode 
              ? 'text-yellow-400 bg-yellow-400/10' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
            }`}
          title={isSeniorMode ? "退出关怀模式" : "开启关怀模式"}
        >
           <div className="flex items-center">
               <Glasses className={`w-5 h-5 ${isSeniorMode ? 'stroke-[2.5px]' : ''}`} />
               <span className={`ml-3 font-medium hidden lg:block ${isSeniorMode ? 'text-lg' : 'text-sm'}`}>
                  关怀模式
               </span>
           </div>
           
           {/* Status Indicator for Desktop */}
           <div className={`w-2 h-2 rounded-full hidden lg:block ${isSeniorMode ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-gray-700'}`}></div>
        </button>
      </div>

      {/* Fixed Tooltip Portal - Renders outside the overflow container */}
      {hoveredFeed && (
        <div 
            className={`fixed z-50 bg-gray-800 text-white px-2 py-1.5 rounded shadow-xl border border-gray-700 lg:hidden pointer-events-none whitespace-nowrap animate-in fade-in duration-150 ${isSeniorMode ? 'text-base' : 'text-xs'}`}
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