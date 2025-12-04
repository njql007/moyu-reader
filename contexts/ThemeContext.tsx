import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'midnight' | 'light' | 'sepia';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    fontSizeLevel: number;
    setFontSizeLevel: (level: number) => void;
    cycleFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load from local storage or default
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('moyu_theme');
        return (saved as Theme) || 'dark';
    });

    const [fontSizeLevel, setFontSizeLevelState] = useState<number>(() => {
        const saved = localStorage.getItem('moyu_font_size');
        return saved ? parseInt(saved, 10) : 0;
    });

    // Persist theme changes
    useEffect(() => {
        localStorage.setItem('moyu_theme', theme);
        // Apply theme class to document root
        const root = document.documentElement;
        root.classList.remove('theme-dark', 'theme-midnight', 'theme-light', 'theme-sepia');
        root.classList.add(`theme-${theme}`);
    }, [theme]);

    // Persist font size changes
    useEffect(() => {
        localStorage.setItem('moyu_font_size', fontSizeLevel.toString());
    }, [fontSizeLevel]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const setFontSizeLevel = (level: number) => {
        setFontSizeLevelState(level);
    };

    const cycleFontSize = () => {
        setFontSizeLevelState(prev => (prev + 1) % 4);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, fontSizeLevel, setFontSizeLevel, cycleFontSize }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
