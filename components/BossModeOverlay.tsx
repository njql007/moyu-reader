import React, { useEffect, useState, useRef } from 'react';
import { useBossMode } from '../contexts/BossModeContext';

const LOG_LINES = [
    "[info] Compiling...",
    "[info] Building for production...",
    "[info] [webpack] Asset optimization started",
    "[info] [webpack] Asset optimization finished",
    "[success] Build completed in 4.2s",
    "[info] Starting development server...",
    "[info] Listening on port 3000",
    "[info] Connected to database",
    "[warn] DeprecationWarning: Buffer() is deprecated due to security and usability issues.",
    "[info] GET /api/v1/health 200 12ms",
    "[info] GET /api/v1/users 200 45ms",
    "[info] POST /api/v1/auth/login 200 120ms",
    "[info] Updating dependencies...",
    "[info] Fetching packages from registry...",
    "[info] Package 'react' updated to 18.3.0",
    "[info] Package 'typescript' updated to 5.4.0",
    "[info] Running linter...",
    "[success] No lint errors found",
    "[info] Running unit tests...",
    "[success] Tests passed: 42/42",
    "[info] Deploying to staging...",
    "[info] Uploading assets...",
    "[success] Deployment successful",
    "[info] Waiting for changes...",
];

export const BossModeOverlay: React.FC = () => {
    const { isBossModeActive } = useBossMode();
    const [logs, setLogs] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isBossModeActive) {
            // Initial logs
            setLogs(LOG_LINES.slice(0, 10));

            // Simulate ongoing logs
            const interval = setInterval(() => {
                setLogs(prev => {
                    const nextLine = LOG_LINES[Math.floor(Math.random() * LOG_LINES.length)];
                    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
                    return [...prev.slice(-20), `[${timestamp}] ${nextLine}`];
                });
            }, 2000);

            return () => clearInterval(interval);
        } else {
            setLogs([]);
        }
    }, [isBossModeActive]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!isBossModeActive) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-green-500 font-mono text-sm p-4 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {logs.map((log, index) => (
                    <div key={index} className="mb-1 break-all whitespace-pre-wrap font-mono">
                        <span className="text-gray-500 mr-2">$</span>
                        {log}
                    </div>
                ))}
                <div ref={bottomRef} />
                <div className="animate-pulse mt-2">
                    <span className="text-gray-500 mr-2">$</span>
                    <span className="w-2 h-4 bg-green-500 inline-block align-middle"></span>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-600 flex justify-between">
                <span>Terminal - zsh</span>
                <span>Press 'b' or 'Esc' to return</span>
            </div>
        </div>
    );
};
