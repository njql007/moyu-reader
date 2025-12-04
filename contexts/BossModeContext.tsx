import React, { createContext, useContext, useState, useEffect } from 'react';

interface BossModeContextType {
    isBossModeActive: boolean;
    toggleBossMode: () => void;
}

const BossModeContext = createContext<BossModeContextType | undefined>(undefined);

export const BossModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isBossModeActive, setIsBossModeActive] = useState(false);

    const toggleBossMode = () => {
        setIsBossModeActive(prev => !prev);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Toggle on 'b' key press
            // Ignore if user is typing in an input or textarea
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (event.key.toLowerCase() === 'b') {
                toggleBossMode();
            }

            // Also allow Esc to exit boss mode if active
            if (isBossModeActive && event.key === 'Escape') {
                setIsBossModeActive(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isBossModeActive]);

    return (
        <BossModeContext.Provider value={{ isBossModeActive, toggleBossMode }}>
            {children}
        </BossModeContext.Provider>
    );
};

export const useBossMode = () => {
    const context = useContext(BossModeContext);
    if (context === undefined) {
        throw new Error('useBossMode must be used within a BossModeProvider');
    }
    return context;
};
