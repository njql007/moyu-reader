import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types';
import { cleanContentWithAI, summarizeContentWithAI } from '../services/geminiService';
import { fetchFullArticle, fetchWebPage } from '../services/rssService';
import { ExternalLink, Sparkles, BookOpen, Globe, MonitorPlay, Zap, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ArticleViewProps {
  article: Article | null;
}

type TabMode = 'READER' | 'WEB';

export const ArticleView: React.FC<ArticleViewProps> = ({ article }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('READER');
  
  // Content states
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [webPageContent, setWebPageContent] = useState<string | null>(null);
  
  // Loading states
  const [isLoadingFullContent, setIsLoadingFullContent] = useState(false);
  const [isLoadingWeb, setIsLoadingWeb] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false); // New state for initial load
  
  // AI states
  const [showAiClean, setShowAiClean] = useState(false);
  const [cleanedContent, setCleanedContent] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when article changes
  useEffect(() => {
    setActiveTab('READER');
    setShowAiClean(false);
    setCleanedContent('');
    setSummary('');
    setFullContent(null);
    setWebPageContent(null);
    setIsProcessing(false);
    setIsSummarizing(false);
    setIsLoadingFullContent(false);
    setIsLoadingWeb(false);
    
    if (contentRef.current) {
        contentRef.current.scrollTop = 0;
    }

    if (article) {
        // Decide if we should show the loading screen
        const contentLen = article.content?.length || 0;
        const isShort = contentLen < 1000;
        
        if (isShort) {
            // Content is short, likely a summary. Show loading screen and fetch full content immediately.
            setShowLoadingScreen(true);
            handleLoadFullContent(article.link, true);
        } else {
            // Content is long enough, likely full text. Show it immediately.
            setShowLoadingScreen(false);
        }
    } else {
        setShowLoadingScreen(false);
    }
  }, [article]);

  const handleLoadFullContent = async (url: string, isInitialLoad = false) => {
      setIsLoadingFullContent(true);
      const content = await fetchFullArticle(url);
      if (content) {
          setFullContent(content);
      }
      setIsLoadingFullContent(false);
      if (isInitialLoad) {
          setShowLoadingScreen(false);
      }
  };

  const handleLoadWebPage = async () => {
      if (!article || webPageContent) return;
      setIsLoadingWeb(true);
      const html = await fetchWebPage(article.link);
      setWebPageContent(html);
      setIsLoadingWeb(false);
  };

  // Trigger web page load when tab switches
  useEffect(() => {
      if (activeTab === 'WEB' && !webPageContent && article) {
          handleLoadWebPage();
      }
  }, [activeTab, article]);

  const handleAiToggle = async () => {
    if (!article) return;
    
    if (showAiClean) {
        setShowAiClean(false);
        return;
    }

    if (cleanedContent) {
        setShowAiClean(true);
        return;
    }
    
    setIsProcessing(true);
    setShowAiClean(true);
    
    // Use the best available content
    const sourceContent = fullContent || article.content;
    const result = await cleanContentWithAI(sourceContent);
    
    setCleanedContent(result);
    setIsProcessing(false);
  };

  const handleSummarize = async () => {
      if(!article) return;
      setIsSummarizing(true);
      // Use full content if available for better summary
      const sourceContent = fullContent || article.content || article.contentSnippet || "";
      const result = await summarizeContentWithAI(sourceContent);
      setSummary(result);
      setIsSummarizing(false);
  }

  if (!article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-gray-950 h-full p-8 text-center select-none">
        <div className="bg-gray-900 p-6 rounded-full mb-6 animate-pulse">
            <MonitorPlay className="w-12 h-12 text-blue-500/50" />
        </div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">Ready to Slack Off?</h3>
        <p className="max-w-md text-gray-500">Select a tech feed from the left to start your distraction-free reading session.</p>
      </div>
    );
  }

  const renderMarkdown = (text: string) => {
    let html = text
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-200 mt-6 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-100 mt-8 mb-4 pb-2 border-b border-gray-800">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold text-white mt-10 mb-6">$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong class="text-gray-100 font-bold">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em class="text-gray-300">$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, '<div class="my-6 rounded-lg overflow-hidden border border-gray-800 bg-gray-900"><img alt="$1" src="$2" class="w-full h-auto object-contain max-h-[600px]" loading="lazy" /></div>')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">$1</a>')
        .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-700 pl-4 py-1 my-4 text-gray-400 italic bg-gray-900/30 rounded-r">$1</blockquote>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-gray-300 mb-1">$1</li>')
        .replace(/\n/gim, '<br />');
    return html;
  };

  const displayContent = fullContent || article.content;
  const isContentVeryShort = !fullContent && (article.content?.length || 0) < 500;

  return (
    <div className="flex-1 flex flex-col bg-gray-950 h-full overflow-hidden relative">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-800 bg-gray-900/95 backdrop-blur flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shrink-0">
        <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
            <button
                onClick={() => setActiveTab('READER')}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'READER' ? 'bg-gray-800 text-white shadow-sm ring-1 ring-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <BookOpen className="w-3.5 h-3.5 mr-2" />
                Smart Reader
            </button>
            <button
                onClick={() => setActiveTab('WEB')}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'WEB' ? 'bg-blue-900/30 text-blue-200 shadow-sm ring-1 ring-blue-500/50' : 'text-gray-500 hover:text-blue-400'}`}
                title="View original webpage"
            >
                <Globe className="w-3.5 h-3.5 mr-2" />
                Original Web
            </button>
        </div>
        
        <div className="flex items-center space-x-2">
            {activeTab === 'READER' && (
                <>
                    <button
                        onClick={handleAiToggle}
                        disabled={showLoadingScreen}
                        className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showAiClean ? 'bg-indigo-900/50 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50' : 'text-gray-500 hover:text-indigo-400 disabled:opacity-30'}`}
                        title="Rewrite with AI to remove clutter"
                    >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                        {showAiClean ? 'AI Polished' : 'AI Polish'}
                    </button>
                    
                    {!fullContent && !isLoadingFullContent && !showLoadingScreen && (
                         <button
                            onClick={() => handleLoadFullContent(article.link)}
                            className="flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            title="Force fetch full content from source"
                        >
                            <Globe className="w-3.5 h-3.5 mr-2" />
                            Load Full
                        </button>
                    )}
                    
                    {isLoadingFullContent && !showLoadingScreen && (
                        <span className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-400 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Fetching...
                        </span>
                    )}

                    <button
                        onClick={handleSummarize}
                        disabled={isSummarizing || !!summary || showLoadingScreen}
                        className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-900/50 bg-emerald-950/30 text-emerald-500 hover:bg-emerald-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSummarizing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-2" />}
                        {summary ? 'Summarized' : 'TL;DR'}
                    </button>
                </>
            )}
            
            <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                title="Open in new tab"
            >
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
      </div>

      {/* WEB View (Iframe) */}
      {activeTab === 'WEB' && (
          <div className="flex-1 bg-white relative w-full h-full">
              {isLoadingWeb ? (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                      <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                          <p className="text-gray-500 text-sm">Loading original page via proxy...</p>
                      </div>
                   </div>
              ) : webPageContent ? (
                  <iframe 
                    srcDoc={webPageContent}
                    title={article.title}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                  />
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <p className="mb-4">Failed to load original content directly.</p>
                      <button 
                        onClick={handleLoadWebPage}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                          Try Again
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* READER View (HTML / Markdown) */}
      {activeTab === 'READER' && (
      <div ref={contentRef} className="flex-1 overflow-y-auto bg-gray-950 scroll-smooth custom-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
          
          {/* Article Header */}
          <header className="mb-8 border-b border-gray-800/50 pb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-100 leading-tight mb-4 font-display">
                {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-mono">
                <span className="flex items-center text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                    {article.author || 'Unknown'}
                </span>
                <span>{new Date(article.pubDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                {showAiClean && (
                    <span className="flex items-center text-indigo-400 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" /> AI Cleaned
                    </span>
                )}
                {fullContent && !showAiClean && !showLoadingScreen && (
                     <span className="flex items-center text-green-400 text-xs">
                        <Globe className="w-3 h-3 mr-1" /> Full Content
                    </span>
                )}
            </div>
          </header>

          {/* AI Summary Block */}
          {summary && !showLoadingScreen && (
              <div className="mb-10 p-5 bg-emerald-950/20 border border-emerald-900/50 rounded-xl relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                  <h4 className="font-bold text-emerald-400 mb-3 flex items-center text-sm uppercase tracking-wider">
                      <Zap className="w-4 h-4 mr-2"/> AI Summary
                  </h4>
                  <div className="text-emerald-100/90 leading-relaxed text-sm space-y-2" dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }} />
              </div>
          )}

          {/* Main Content */}
          <div className="min-h-[50vh]">
            {showLoadingScreen ? (
                // Initial Full Loading Screen
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-gray-300 font-medium">Fetching full article...</p>
                        <p className="text-gray-600 text-xs">Parsing content from {new URL(article.link).hostname}</p>
                    </div>
                </div>
            ) : showAiClean ? (
                // AI Clean Mode
                isProcessing ? (
                    <div className="space-y-6 py-8 animate-pulse max-w-2xl mx-auto">
                        <div className="h-4 bg-gray-800 rounded w-full"></div>
                        <div className="h-4 bg-gray-800 rounded w-11/12"></div>
                        <div className="h-4 bg-gray-800 rounded w-full"></div>
                        <div className="h-64 bg-gray-800 rounded-lg w-full my-8 opacity-50"></div>
                        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                        <p className="text-center text-indigo-400/50 text-sm mt-8 animate-bounce">Gemini is rewriting the article...</p>
                    </div>
                ) : cleanedContent ? (
                    <div className="prose prose-invert prose-lg max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-img:rounded-xl prose-img:border prose-img:border-gray-800">
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanedContent) }} />
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-red-400 mb-2">Could not clean content.</p>
                        <button onClick={() => setShowAiClean(false)} className="text-gray-400 underline hover:text-white">Switch to Original</button>
                    </div>
                )
            ) : (
                // Standard Reader Mode
                <div className="prose prose-invert prose-lg max-w-none prose-img:rounded-xl prose-img:max-w-full prose-img:h-auto prose-video:w-full prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400">
                    <div dangerouslySetInnerHTML={{ __html: displayContent }} />
                    
                    {/* Fallback if content is missing or very short and not yet fetched */}
                    {!displayContent && !isLoadingFullContent && (
                        <div className="p-8 border border-gray-800 bg-gray-900/30 rounded-xl text-center my-8">
                            <p className="text-gray-400 mb-4">
                                Full content not available in RSS feed.
                            </p>
                            <button 
                                onClick={() => handleLoadFullContent(article.link)}
                                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                                <Globe className="w-4 h-4 mr-2"/> Load Full Content
                            </button>
                        </div>
                    )}

                    {isContentVeryShort && !isLoadingFullContent && !fullContent && (
                        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                            <p className="text-gray-500 text-sm mb-3">This article seems short. It might be a summary.</p>
                             <button 
                                onClick={() => handleLoadFullContent(article.link)}
                                className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors font-medium text-xs border border-gray-700"
                            >
                                <Globe className="w-3 h-3 mr-2"/> Try Loading Full Content
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};