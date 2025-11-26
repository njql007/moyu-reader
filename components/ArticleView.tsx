import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types';
import { fetchFullArticle, fetchWebPage } from '../services/rssService';
import { broadcastActivity } from '../services/firebase';
import { ExternalLink, BookOpen, Globe, MonitorPlay, Loader2, Globe as GlobeIcon, ChevronLeft } from 'lucide-react';

interface ArticleViewProps {
    article: Article | null;
    onBack?: () => void;
    fontSizeLevel: number;
}

type TabMode = 'READER' | 'WEB';

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, fontSizeLevel }) => {
    const [activeTab, setActiveTab] = useState<TabMode>('READER');

    // Content states
    const [fullContent, setFullContent] = useState<string | null>(null);
    const [webPageContent, setWebPageContent] = useState<string | null>(null);

    // Loading states
    const [isLoadingFullContent, setIsLoadingFullContent] = useState(false);
    const [isLoadingWeb, setIsLoadingWeb] = useState(false);
    const [showLoadingScreen, setShowLoadingScreen] = useState(false); // New state for initial load

    const contentRef = useRef<HTMLDivElement>(null);

    // Reset state when article changes
    useEffect(() => {
        setActiveTab('READER');
        setFullContent(null);
        setWebPageContent(null);
        setIsLoadingFullContent(false);
        setIsLoadingWeb(false);

        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }

        if (article) {
            // Broadcast activity with link
            broadcastActivity('reading', article.title, article.link);

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

    if (!article) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-gray-950 h-full p-8 text-center select-none">
                <div className="bg-gray-900 p-6 rounded-full mb-6 animate-pulse">
                    <MonitorPlay className="w-12 h-12 text-blue-500/50" />
                </div>
                <h3 className={`font-medium text-gray-300 mb-2 ${fontSizeLevel > 1 ? 'text-2xl' : 'text-xl'}`}>Ready to Slack Off?</h3>
                <p className={`max-w-md text-gray-500 ${fontSizeLevel > 1 ? 'text-lg' : ''}`}>Select a tech feed from the left to start your distraction-free reading session.</p>
            </div>
        );
    }

    const displayContent = fullContent || article.content;
    const isContentVeryShort = !fullContent && (article.content?.length || 0) < 500;

    // Font Size Helpers
    const getProseClass = () => {
        switch (fontSizeLevel) {
            case 3: return 'prose-2xl prose-p:text-3xl prose-li:text-3xl'; // Custom huge override
            case 2: return 'prose-2xl';
            case 1: return 'prose-xl';
            default: return 'prose-lg';
        }
    };

    const getH1Class = () => {
        if (fontSizeLevel >= 3) return 'text-5xl md:text-7xl leading-tight';
        if (fontSizeLevel === 2) return 'text-4xl md:text-5xl leading-tight';
        if (fontSizeLevel === 1) return 'text-3xl md:text-4xl leading-tight';
        return 'text-2xl md:text-3xl leading-tight';
    };

    const getMetaClass = () => {
        if (fontSizeLevel >= 3) return 'text-xl md:text-2xl';
        if (fontSizeLevel === 2) return 'text-lg md:text-xl';
        if (fontSizeLevel === 1) return 'text-base md:text-lg';
        return 'text-xs md:text-sm';
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-950 h-full overflow-hidden relative">
            {/* Toolbar */}
            <div className="h-14 border-b border-gray-800 bg-gray-900/95 backdrop-blur flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Mobile Back Button - Re-styled */}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="md:hidden group flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 active:scale-95 transition-all shadow-sm"
                            title="Back to list"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
                        <button
                            onClick={() => setActiveTab('READER')}
                            className={`flex items-center px-3 py-1.5 rounded-md font-medium transition-all ${fontSizeLevel > 1 ? 'text-sm' : 'text-xs'} ${activeTab === 'READER' ? 'bg-gray-800 text-white shadow-sm ring-1 ring-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <BookOpen className={`${fontSizeLevel > 1 ? 'w-4 h-4' : 'w-3.5 h-3.5'} mr-2`} />
                            Reader
                        </button>
                        <button
                            onClick={() => setActiveTab('WEB')}
                            className={`flex items-center px-3 py-1.5 rounded-md font-medium transition-all ${fontSizeLevel > 1 ? 'text-sm' : 'text-xs'} ${activeTab === 'WEB' ? 'bg-blue-900/30 text-blue-200 shadow-sm ring-1 ring-blue-500/50' : 'text-gray-500 hover:text-blue-400'}`}
                            title="View original webpage"
                        >
                            <Globe className={`${fontSizeLevel > 1 ? 'w-4 h-4' : 'w-3.5 h-3.5'} mr-2`} />
                            Web
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {activeTab === 'READER' && (
                        <>
                            {!fullContent && !isLoadingFullContent && !showLoadingScreen && (
                                <button
                                    onClick={() => handleLoadFullContent(article.link)}
                                    className={`flex items-center px-3 py-1.5 rounded-md font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${fontSizeLevel > 1 ? 'text-sm' : 'text-xs'}`}
                                    title="Force fetch full content from source"
                                >
                                    <GlobeIcon className={`${fontSizeLevel > 1 ? 'w-4 h-4' : 'w-3.5 h-3.5'} mr-2`} />
                                    Load Full
                                </button>
                            )}

                            {isLoadingFullContent && !showLoadingScreen && (
                                <span className={`flex items-center px-3 py-1.5 font-medium text-blue-400 animate-pulse ${fontSizeLevel > 1 ? 'text-sm' : 'text-xs'}`}>
                                    <Loader2 className={`${fontSizeLevel > 1 ? 'w-4 h-4' : 'w-3.5 h-3.5'} mr-2 animate-spin`} />
                                    Fetching...
                                </span>
                            )}
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
                    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">

                        {/* Article Header */}
                        <header className={`mb-8 border-b border-gray-800/50 pb-8 ${fontSizeLevel > 0 ? 'space-y-4' : ''}`}>
                            <h1 className={`${getH1Class()} font-bold text-gray-100 mb-4 font-display`}>
                                {article.title}
                            </h1>
                            <div className={`flex flex-wrap items-center gap-4 ${getMetaClass()} text-gray-500 font-mono`}>
                                <span className="flex items-center text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                                    {article.author || 'Unknown'}
                                </span>
                                <span>{new Date(article.pubDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                {fullContent && !showLoadingScreen && (
                                    <span className={`flex items-center text-green-400 ${fontSizeLevel > 1 ? 'text-sm' : 'text-xs'}`}>
                                        <GlobeIcon className={`${fontSizeLevel > 1 ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} /> Full Content
                                    </span>
                                )}
                            </div>
                        </header>

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
                                        <p className={`text-gray-300 font-medium ${fontSizeLevel > 1 ? 'text-xl' : ''}`}>Fetching full article...</p>
                                        <p className="text-gray-600 text-xs">Parsing content from {new URL(article.link).hostname}</p>
                                    </div>
                                </div>
                            ) : (
                                // Standard Reader Mode with Senior Mode support
                                <div className={`prose prose-invert max-w-none 
                    prose-img:rounded-xl prose-img:max-w-full prose-img:h-auto prose-video:w-full
                    prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400
                    ${getProseClass()}`}>
                                    <div dangerouslySetInnerHTML={{ __html: displayContent }} />

                                    {/* Fallback if content is missing or very short and not yet fetched */}
                                    {!displayContent && !isLoadingFullContent && (
                                        <div className="p-8 border border-gray-800 bg-gray-900/30 rounded-xl text-center my-8">
                                            <p className="text-gray-400 mb-4">
                                                Full content not available in RSS feed.
                                            </p>
                                            <button
                                                onClick={() => handleLoadFullContent(article.link)}
                                                className={`inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium ${fontSizeLevel > 1 ? 'text-lg' : 'text-sm'}`}
                                            >
                                                <GlobeIcon className="w-4 h-4 mr-2" /> Load Full Content
                                            </button>
                                        </div>
                                    )}

                                    {isContentVeryShort && !isLoadingFullContent && !fullContent && (
                                        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                                            <p className={`text-gray-500 mb-3 ${fontSizeLevel > 1 ? 'text-base' : 'text-sm'}`}>This article seems short. It might be a summary.</p>
                                            <button
                                                onClick={() => handleLoadFullContent(article.link)}
                                                className={`inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors font-medium border border-gray-700 ${fontSizeLevel > 1 ? 'text-base' : 'text-xs'}`}
                                            >
                                                <GlobeIcon className={`${fontSizeLevel > 1 ? 'w-4 h-4' : 'w-3 h-3'} mr-2`} /> Try Loading Full Content
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