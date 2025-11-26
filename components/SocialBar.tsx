import React, { useEffect, useState } from 'react';
import { broadcastService, SocialActivity } from '../services/broadcastService';
import { Users, Activity as ActivityIcon } from 'lucide-react';

export const SocialBar: React.FC = () => {
    const [onlineCount, setOnlineCount] = useState(1);
    const [latestActivity, setLatestActivity] = useState<SocialActivity | null>(null);

    useEffect(() => {
        const unsubPresence = broadcastService.onPresenceChange(setOnlineCount);
        const unsubActivity = broadcastService.onActivity(setLatestActivity);

        return () => {
            unsubPresence();
            unsubActivity();
        };
    }, []);

    return (
        <div className="h-8 bg-gray-950 border-t border-gray-800 flex items-center px-4 text-xs text-gray-500 select-none overflow-hidden">
            {/* Online Count */}
            <div className="flex items-center mr-6 text-green-500/80 shrink-0" title="Active tabs in this browser">
                <Users className="w-3 h-3 mr-1.5" />
                <span className="font-medium">{onlineCount} Online</span>
            </div>

            {/* Activity Ticker */}
            <div className="flex-1 flex items-center overflow-hidden relative">
                <div className="flex items-center animate-in slide-in-from-bottom-2 fade-in duration-500" key={latestActivity?.id || 'empty'}>
                    {latestActivity ? (
                        <>
                            <ActivityIcon className="w-3 h-3 mr-2 text-blue-500/70" />
                            <span className="truncate text-gray-400">
                                <span className="text-gray-500">Someone is</span> {latestActivity.action}
                                {latestActivity.target && <span className="text-gray-300 ml-1">"{latestActivity.target}"</span>}
                            </span>
                            <span className="ml-2 text-gray-600 text-[10px]">
                                {new Date(latestActivity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
