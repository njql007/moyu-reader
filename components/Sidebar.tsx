import React, { useState } from 'react';
import { FEEDS, MIXED_FEED_CN } from '../constants';
import { RSSFeed } from '../types';
import { Coffee, Rss, Type, Palette, Trophy, Star } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useGamification } from '../contexts/GamificationContext';

interface SidebarProps {
  selectedFeedId: string | null;
  onSelectFeed: (feed: RSSFeed) => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedFeedId, onSelectFeed, isCollapsed = false }) => {
  const [hoveredFeed, setHoveredFeed] = useState<{ name: string; top: number; left: number } | null>(null);
  const [hoveredProfile, setHoveredProfile] = useState<{ top: number; left: number } | null>(null);
  const { theme, setTheme, fontSizeLevel, cycleFontSize } = useTheme();
  const { userProfile } = useGamification();

  const themes: Theme[] = ['dark', 'midnight', 'light', 'sepia'];
  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeLabel = (t: Theme) => {
    switch (t) {
      case 'dark': return "主题: 暗色";
      case 'midnight': return "主题: 深蓝";
      case 'light': return "主题: 亮色";
      case 'sepia': return "主题: 护眼";
      default: return "主题";
    }
  };

  const getFontSizeLabel = (level: number) => {
    switch (level) {
      case 0: return "字号: 标准";
      case 1: return "字号: 大";
      case 2: return "字号: 超大";
      case 3: return "字号: 特大";
      default: return "字号";
    }
  };

  // XP Progress Calculation
  // Threshold for next level = 50 * (Level + 1) * Level
  // Current Level Base = 50 * Level * (Level - 1)
  // Progress = (TotalXP - Base) / (Threshold - Base)
  const currentLevel = userProfile?.level || 1;
  const nextLevelThreshold = 50 * (currentLevel + 1) * currentLevel;
  const currentLevelBase = 50 * currentLevel * (currentLevel - 1);
  const xpNeededForLevel = nextLevelThreshold - currentLevelBase;
  const xpProgress = userProfile ? userProfile.xp - currentLevelBase : 0;
  const progressPercent = Math.min(100, Math.max(0, (xpProgress / xpNeededForLevel) * 100));

  return (
    <div className={`w-12 md:w-14 ${isCollapsed ? 'lg:w-14' : 'lg:w-64'} h-full bg-surface border-r border-border flex flex-col flex-shrink-0 relative z-40 transition-all duration-300 ease-in-out`}>
      {/* Logo Area */}
      <div className={`h-16 flex items-center justify-center ${isCollapsed ? '' : 'lg:justify-start lg:px-6'} border-b border-border flex-shrink-0`}>
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Coffee className="text-white w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        <span className={`ml-3 font-bold text-primary hidden ${isCollapsed ? '' : 'lg:block'} tracking-tight ${fontSizeLevel > 0 ? 'text-2xl' : 'text-xl'}`}>Moyu</span>
      </div>

      {/* User Profile Card */}
      {userProfile && (
        <div
          className={`border-b border-border bg-elevated/50 ${isCollapsed ? 'py-2' : 'p-4'} cursor-default`}
          onMouseEnter={(e) => {
            if (isCollapsed || window.innerWidth < 1024) {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredProfile({
                top: rect.top + (rect.height / 2),
                left: rect.right
              });
            }
          }}
          onMouseLeave={() => setHoveredProfile(null)}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-1' : 'gap-3'}`}>
            <div className="relative shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner">
                {userProfile.level}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[10px] text-black font-bold px-1 rounded-full border border-surface">
                LV
              </div>
            </div>

            <div className={`flex flex-col overflow-hidden ${isCollapsed ? 'hidden' : 'lg:flex'}`}>
              <span className="font-bold text-primary truncate text-sm">{userProfile.name}</span>
              <span className="text-xs text-accent truncate">{userProfile.title}</span>
            </div>
          </div>

          {/* XP Bar */}
          <div className={`mt-3 ${isCollapsed ? 'hidden' : 'lg:block'}`}>
            <div className="flex justify-between text-[10px] text-muted mb-1">
              <span>XP</span>
              <span>{xpProgress} / {xpNeededForLevel}</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feeds List */}
      <div
        className="flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar"
        onScroll={() => setHoveredFeed(null)}
      >
        <div className={`px-4 mb-2 hidden ${isCollapsed ? '' : 'lg:block'} font-semibold text-muted uppercase tracking-wider ${fontSizeLevel > 1 ? 'text-sm' : 'text-xs'}`}>
          Tech Feeds
        </div>

        {/* Mixed Feed Option */}
        <button
          onClick={() => onSelectFeed(MIXED_FEED_CN)}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredFeed({
              name: MIXED_FEED_CN.name,
              top: rect.top + (rect.height / 2),
              left: rect.right
            });
          }}
          onMouseLeave={() => setHoveredFeed(null)}
          className={`w-full flex items-center justify-center ${isCollapsed ? '' : 'lg:justify-start px-0 lg:px-4'} py-2 transition-all duration-200 relative group mb-2
            ${selectedFeedId === MIXED_FEED_CN.id
              ? `bg-elevated text-accent border-r-2 border-accent ${isCollapsed ? '' : 'lg:border-r-0'}`
              : 'text-muted hover:bg-elevated hover:text-primary'
            }`}
          aria-label={MIXED_FEED_CN.name}
        >
          <span className="text-lg lg:text-xl w-6 text-center flex justify-center">{MIXED_FEED_CN.icon}</span>
          <span className={`ml-3 font-medium hidden ${isCollapsed ? '' : 'lg:block'} truncate ${fontSizeLevel > 0 ? 'text-lg' : 'text-sm'}`}>{MIXED_FEED_CN.name}</span>

          {selectedFeedId === MIXED_FEED_CN.id && !isCollapsed && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent hidden lg:block rounded-r-full"></div>
          )}
        </button>

        <div className="h-px bg-border mx-4 my-2"></div>

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
                ? `bg-elevated text-accent border-r-2 border-accent ${isCollapsed ? '' : 'lg:border-r-0'}`
                : 'text-muted hover:bg-elevated hover:text-primary'
              }`}
            aria-label={feed.name}
          >
            <span className="text-lg lg:text-xl w-6 text-center flex justify-center">{feed.icon || <Rss className="w-5 h-5" />}</span>
            <span className={`ml-3 font-medium hidden ${isCollapsed ? '' : 'lg:block'} truncate ${fontSizeLevel > 0 ? 'text-lg' : 'text-sm'}`}>{feed.name}</span>

            {/* Active indicator for large screens (border-l style instead of right border) */}
            {selectedFeedId === feed.id && !isCollapsed && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent hidden lg:block rounded-r-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Settings Area (Bottom) */}
      {/* pb-[env(safe-area-inset-bottom)] ensures content isn't hidden behind Home indicator on iPhone */}
      <div className="border-t border-border bg-surface flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className={`w-full flex flex-col ${isCollapsed ? '' : 'lg:flex-row'} items-center justify-center ${isCollapsed ? '' : 'lg:justify-between px-0 lg:px-6'} py-3 lg:py-3 transition-colors duration-200 outline-none text-muted hover:text-primary hover:bg-elevated border-b border-border`}
          title="切换主题"
        >
          <div className="flex items-center">
            <Palette className="w-5 h-5" />
            <span className={`ml-3 font-medium hidden ${isCollapsed ? '' : 'lg:block'} ${fontSizeLevel > 1 ? 'text-lg' : 'text-sm'}`}>
              {getThemeLabel(theme)}
            </span>
          </div>
        </button>

        {/* Font Size Toggle */}
        <button
          onClick={cycleFontSize}
          className={`w-full flex flex-col ${isCollapsed ? '' : 'lg:flex-row'} items-center justify-center ${isCollapsed ? '' : 'lg:justify-between px-0 lg:px-6'} py-4 lg:py-4 transition-colors duration-200 outline-none
            ${fontSizeLevel > 0
              ? 'text-accent bg-accent/5'
              : 'text-muted hover:text-primary hover:bg-elevated'
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
                className={`w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full ${level <= fontSizeLevel ? 'bg-accent' : 'bg-gray-700'}`}
              ></div>
            ))}
          </div>
        </button>
      </div>

      {/* Fixed Tooltip Portal for Feeds */}
      {hoveredFeed && (
        <div
          className={`fixed z-50 bg-elevated text-primary px-2 py-1.5 rounded shadow-xl border border-border ${isCollapsed ? '' : 'lg:hidden'} pointer-events-none whitespace-nowrap animate-in fade-in duration-150 ${fontSizeLevel > 1 ? 'text-base' : 'text-xs'}`}
          style={{
            top: hoveredFeed.top,
            left: hoveredFeed.left + 10,
            transform: 'translateY(-50%)'
          }}
        >
          {hoveredFeed.name}
          {/* Tiny arrow pointing left */}
          <div className="absolute top-1/2 -left-1 w-2 h-2 bg-elevated border-l border-b border-border transform -translate-y-1/2 rotate-45"></div>
        </div>
      )}

      {/* Fixed Tooltip Portal for Profile */}
      {hoveredProfile && userProfile && (
        <div
          className={`fixed z-50 bg-elevated text-primary p-3 rounded-lg shadow-xl border border-border pointer-events-none min-w-[160px] animate-in fade-in duration-150`}
          style={{
            top: hoveredProfile.top,
            left: hoveredProfile.left + 10,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="font-bold text-sm mb-1">{userProfile.name}</div>
          <div className="text-xs text-accent mb-2">{userProfile.title}</div>

          <div className="flex justify-between text-[10px] text-muted mb-1">
            <span>XP</span>
            <span>{userProfile.xp - (50 * userProfile.level * (userProfile.level - 1))} / {50 * (userProfile.level + 1) * userProfile.level - 50 * userProfile.level * (userProfile.level - 1)}</span>
          </div>
          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ width: `${Math.min(100, Math.max(0, ((userProfile.xp - (50 * userProfile.level * (userProfile.level - 1))) / (50 * (userProfile.level + 1) * userProfile.level - 50 * userProfile.level * (userProfile.level - 1))) * 100))}%` }}
            />
          </div>

          {/* Tiny arrow pointing left */}
          <div className="absolute top-1/2 -left-1 w-2 h-2 bg-elevated border-l border-b border-border transform -translate-y-1/2 rotate-45"></div>
        </div>
      )}
    </div>
  );
};