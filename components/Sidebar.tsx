import React, { useState } from 'react';
import { FEEDS } from '../constants';
import { RSSFeed } from '../types';
import { Coffee, Rss, Type } from 'lucide-react';

interface SidebarProps {
  selectedFeedId: string | null;
  onSelectFeed: (feed: RSSFeed) => void;
  fontSizeLevel: number;
  onCycleFontSize: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedFeedId, onSelectFeed, fontSizeLevel, onCycleFontSize, isCollapsed = false }) => {
  const [hoveredFeed, setHoveredFeed] = useState<{ name: string; top: number; left: number } | null>(null);

  const getFontSizeLabel = (level: number) => {
    switch (level) {
      case 0: return "字号: 标准";
      case 1: return "字号: 大";
      case 2: return "字号: 超大";
      case 3: return "字号: 特大";
      default: return "字号";
    }
  };

  return (
    <div className={`w-12 md:w-14 ${isCollapsed ? 'lg:w-14' : 'lg:w-64'} h-full bg-gray-950 border-r border-gray-800 flex flex-col flex-shrink-0 relative z-40 transition-all duration-300 ease-in-out`}>
      {/* Logo Area */}
      <div className={`h-16 flex items-center justify-center ${isCollapsed ? '' : 'lg:justify-start lg:px-6'} border-b border-gray-800 flex-shrink-0`}>
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Coffee className="text-white w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        <span className={`ml-3 font-bold text-white hidden ${isCollapsed ? '' : 'lg:block'} tracking-tight ${fontSizeLevel > 0 ? 'text-2xl' : 'text-xl'}`}>Moyu</span>
      </div>

      {/* Feeds List */}
      <div
        className="flex-1 overflow-y-auto py-3 space-y-1"
        onScroll={() => setHoveredFeed(null)}
      >
        <div className={`px-4 mb-2 hidden ${isCollapsed ? '' : 'lg:block'} font-semibold text-gray-500 uppercase tracking-wider ${fontSizeLevel > 1 ? 'text-sm' : 'text-xs'}`}>
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
            className={`w-full flex items-center justify-center ${isCollapsed ? '' : 'lg:justify-start px-0 lg:px-4'} py-2 transition-all duration-200 relative group
              ${selectedFeedId === feed.id
                ? `bg-gray-800/50 text-blue-400 border-r-2 border-blue-500 ${isCollapsed ? '' : 'lg:border-r-0'}`
                : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            aria-label={feed.name}
          >
            <span className="text-lg lg:text-xl w-6 text-center flex justify-center">{feed.icon || <Rss className="w-5 h-5" />}</span>
            <span className={`ml-3 font-medium hidden ${isCollapsed ? '' : 'lg:block'} truncate ${fontSizeLevel > 0 ? 'text-lg' : 'text-sm'}`}>{feed.name}</span>

            {/* Active indicator for large screens (border-l style instead of right border) */}
            {selectedFeedId === feed.id && !isCollapsed && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 hidden lg:block rounded-r-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Senior Mode / Font Size Toggle (Bottom) */}
      {/* pb-[env(safe-area-inset-bottom)] ensures content isn't hidden behind Home indicator on iPhone */}
      <div className="border-t border-gray-800 bg-gray-950 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={onCycleFontSize}
          className={`w-full flex flex-col ${isCollapsed ? '' : 'lg:flex-row'} items-center justify-center ${isCollapsed ? '' : 'lg:justify-between px-0 lg:px-6'} py-4 lg:py-4 transition-colors duration-200 outline-none
            ${fontSizeLevel > 0
              ? 'text-yellow-400 bg-yellow-400/5'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
            }`}
          title="调整字体大小"
        >
          <div className="flex items-center">
            <Type className={`w-5 h-5 ${fontSizeLevel > 0 ? 'stroke-[2.5px]' : ''}`} />
            <span className={`ml-3 font-medium hidden ${isCollapsed ? '' : 'lg:block'} ${fontSizeLevel > 1 ? 'text-lg' : 'text-sm'}`}>
              {getFontSizeLabel(fontSizeLevel)}
            </span>
          </div>

          {/* Level Indicators (Dots) */}
          <div className={`flex space-x-1 mt-1 ${isCollapsed ? '' : 'lg:mt-0'}`}>
            {[0, 1, 2, 3].map(level => (
              <div
                key={level}
                className={`w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full ${level <= fontSizeLevel ? (fontSizeLevel > 0 ? 'bg-yellow-400' : 'bg-blue-500') : 'bg-gray-700'}`}
              ></div>
            ))}
          </div>
        </button>
      </div>

      {/* Fixed Tooltip Portal - Renders outside the overflow container */}
      {hoveredFeed && (
        <div
          className={`fixed z-50 bg-gray-800 text-white px-2 py-1.5 rounded shadow-xl border border-gray-700 ${isCollapsed ? '' : 'lg:hidden'} pointer-events-none whitespace-nowrap animate-in fade-in duration-150 ${fontSizeLevel > 1 ? 'text-base' : 'text-xs'}`}
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