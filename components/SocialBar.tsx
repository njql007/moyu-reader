import React, { useEffect, useState } from 'react';
import { initPresence, subscribeToActivity, Activity } from '../services/firebase';
import { Users, Activity as ActivityIcon, ExternalLink } from 'lucide-react';

export const SocialBar: React.FC = () => {
    const [onlineCount, setOnlineCount] = useState(1);
    const [latestActivity, setLatestActivity] = useState<Activity | null>(null);

    useEffect(() => {
        const cleanupPresence = initPresence(setOnlineCount);
        const cleanupActivity = subscribeToActivity((activities) => {
            if (activities.length > 0) {
                setLatestActivity(activities[0]);
            }
        });

        return () => {
            cleanupPresence();
            cleanupActivity();
        };
    }, []);

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
                    {latestActivity ? (
                        <>
                            <ActivityIcon className="w-3 h-3 mr-2 text-blue-500/70" />
                            <span className="truncate text-gray-400 flex items-center">
                                <span className="text-gray-500 mr-1">Someone is</span>
                                {latestActivity.action}
                                {latestActivity.target && (
                                    latestActivity.link ? (
                                        <a
                                            href={latestActivity.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 ml-1 flex items-center hover:underline cursor-pointer"
                                        >
                                            "{latestActivity.target}"
                                            <ExternalLink className="w-2 h-2 ml-0.5 opacity-70" />
                                        </a>
                                    ) : (
                                        <span className="text-gray-300 ml-1">"{latestActivity.target}"</span>
                                    )
                                )}
                            </span>
                            <span className="ml-2 text-gray-600 text-[10px]">
                                {new Date(latestActivity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </>
                    ) : (
                        <span className="text-gray-700 italic">Waiting for activity...</span>
                    )}
                </div>
            </div>
        </div>
    );
};
