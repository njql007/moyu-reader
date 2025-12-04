import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { subscribeToUserProfile, updateUserXP } from '../services/firebase';

interface GamificationContextType {
    userProfile: UserProfile | null;
    addXP: (amount: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToUserProfile((profile) => {
            setUserProfile(profile);
        });
        return () => unsubscribe();
    }, []);

    const addXP = (amount: number) => {
        updateUserXP(amount);
    };

    return (
        <GamificationContext.Provider value={{ userProfile, addXP }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
