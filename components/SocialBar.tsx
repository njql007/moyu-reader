import React, { useEffect, useState } from 'react';
import { initPresence, subscribeToActivity, Activity } from '../services/firebase';
import { Users, Activity as ActivityIcon, ExternalLink, ArrowRight } from 'lucide-react';
import { Article } from '../types';

interface SocialBarProps {
    currentArticle: Article | null;
    onNavigate: (feedId: string, articleLink: string) => void;
}

export const SocialBar: React.FC<SocialBarProps> = ({ currentArticle, onNavigate }) => {
    const [onlineCount, setOnlineCount] = useState(1);
    const [latestActivity, setLatestActivity] = useState<Activity | null>(null);

    useEffect(() => {
        const cleanupPresence = initPresence(setOnlineCount);
        const cleanupActivity = subscribeToActivity((activities) => {
            if (activities.length > 0) {
                // Filter out activities that match what the user is currently reading
                // We do this check inside the render or effect, but here we just store the latest.
                // Actually, let's store the latest valid one.
                setLatestActivity(activities[0]);
            }
        });

        return () => {
            cleanupPresence();
            cleanupActivity();
        };
    }, []);

    // Derived state: Should we show the latest activity?
    const shouldShowActivity = latestActivity && (!currentArticle || latestActivity.link !== currentArticle.link);

    return (
        <div className="h-8 bg-gray-950 border-t border-gray-800 flex items-center px-4 text-xs text-gray-500 select-none overflow-hidden">
            {/* Online Count */}
            <div className="flex items-center mr-6 text-green-500/80 shrink-0" title="Active tabs">
                <Users className="w-3 h-3 mr-1.5" />
                <span className="font-medium">{onlineCount} Online</span>
            </div>

            {/* Activity Ticker */}
            <div className="flex-1 flex items-center overflow-hidden relative">
                <div className="flex items-center animate-in slide-in-from-bottom-2 fade-in duration-500" key={latestActivity?.id || 'empty'}>
                    {shouldShowActivity ? (
                        <>
                            <ActivityIcon className="w-3 h-3 mr-2 text-blue-500/70" />
                            <span className="truncate text-gray-400 flex items-center">
                                <span className="text-gray-500 mr-1">Someone is</span>
                                {latestActivity!.action}
                                {latestActivity!.target && (
                                    latestActivity!.link && latestActivity!.feedId ? (
                                        <button
                                            onClick={() => onNavigate(latestActivity!.feedId!, latestActivity!.link!)}
                                            className="text-blue-400 hover:text-blue-300 ml-1 flex items-center hover:underline cursor-pointer bg-transparent border-none p-0 z-10 pointer-events-auto"
                                        >
                                            "{latestActivity!.target}"
                                            <ArrowRight className="w-2 h-2 ml-1 opacity-70" />
                                        </button>
                                    ) : (
                                        <span className="text-gray-300 ml-1">"{latestActivity!.target}"</span>
                                    )
                                )}
                            </span>
                            <span className="ml-2 text-gray-600 text-[10px]">
                                {new Date(latestActivity!.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </>
                    ) : (
                        <span className="text-gray-700 italic">
                            {latestActivity ? "You are reading this together." : "Waiting for activity..."}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
