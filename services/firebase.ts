import { initializeApp } from 'firebase/app';
import {
    getDatabase,
    ref,
    onDisconnect,
    set,
    onValue,
    push,
    serverTimestamp,
    query,
    limitToLast,
    orderByChild,
    runTransaction
} from 'firebase/database';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
const app = isConfigured ? initializeApp(firebaseConfig) : null;
const db = app ? getDatabase(app) : null;

const getSessionId = () => {
    const stored = localStorage.getItem('moyu_session_id');
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('moyu_session_id', newId);
    return newId;
};

export const sessionId = getSessionId();

export interface Activity {
    id?: string;
    user: string;
    sessionId?: string; // Add sessionId to track origin
    action: string;
    target?: string;
    link?: string; // URL to the article
    feedId?: string;
    timestamp: number;
}

export const initPresence = (onCountChange: (count: number) => void) => {
    if (!db) return () => { };

    const connectedRef = ref(db, '.info/connected');
    const userStatusRef = ref(db, `/status/${sessionId}`);
    const allStatusRef = ref(db, '/status');

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            onDisconnect(userStatusRef).remove();
            set(userStatusRef, {
                state: 'online',
                last_changed: serverTimestamp(),
            });
        }
    });

    const unsubscribeCount = onValue(allStatusRef, (snap) => {
        const val = snap.val();
        const count = val ? Object.keys(val).length : 0;
        onCountChange(count);
    });

    return () => {
        unsubscribeConnected();
        unsubscribeCount();
        if (db) {
            set(userStatusRef, null);
        }
    };
};

export const broadcastActivity = (action: string, target?: string, link?: string, feedId?: string) => {
    if (!db) return;

    const activityRef = ref(db, '/activity');
    const newActivityRef = push(activityRef);

    set(newActivityRef, {
        user: 'Anonymous Reader',
        sessionId, // Include sessionId
        action,
        target: target || '',
        link: link || '',
        feedId: feedId || '',
        timestamp: serverTimestamp()
    });
};

export const subscribeToActivity = (callback: (activities: Activity[]) => void) => {
    if (!db) return () => { };

    const activityRef = ref(db, '/activity');
    const recentActivityQuery = query(activityRef, orderByChild('timestamp'), limitToLast(5));

    const unsubscribe = onValue(recentActivityQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list: Activity[] = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            list.sort((a, b) => b.timestamp - a.timestamp);
            callback(list);
        } else {
            callback([]);
        }
    });

    return unsubscribe;
};

// Gamification Logic

const ADJECTIVES = ['摸鱼的', '犯困的', '划水的', '不想上班的', '带薪拉屎的', '正在编译的', '等待部署的', '假装工作的', '喝咖啡的', '写Bug的'];
const NOUNS = ['熊猫', '程序员', '产品经理', '设计师', '实习生', '考拉', '树懒', '咸鱼', '打工人', '键盘侠'];

const TITLES = [
    '摸鱼实习生',
    '初级划水员',
    '中级摸鱼师',
    '高级摸鱼专家',
    '资深划水顾问',
    '摸鱼架构师',
    '首席摸鱼官 (CMO)',
    '摸鱼界泰斗',
    '传说中的摸鱼仙人',
    '宇宙级摸鱼大帝'
];

const getRandomName = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj}${noun}`;
};

const getTitleForLevel = (level: number) => {
    if (level <= 0) return TITLES[0];
    if (level >= TITLES.length) return TITLES[TITLES.length - 1];
    return TITLES[level - 1];
};

export const subscribeToUserProfile = (callback: (profile: any) => void) => {
    if (!db) return () => { };

    const userRef = ref(db, `/users/${sessionId}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            // Initialize new user
            const newProfile = {
                userId: sessionId,
                name: getRandomName(),
                level: 1,
                xp: 0,
                title: TITLES[0],
                lastXpTime: Date.now(),
                xpInLastMinute: 0
            };
            set(userRef, newProfile);
        }
    });

    return unsubscribe;
};

export const updateUserXP = (xpToAdd: number) => {
    if (!db) return;

    const userRef = ref(db, `/users/${sessionId}`);

    // We need to read the current state to check throttling
    // Since we are inside a subscription in the context, we could pass the current state,
    // but reading here ensures atomicity if we used transactions (simplified here for now).
    // For simplicity with Firebase Realtime DB, we'll just do a transaction-like update.

    // Note: In a real app, use runTransaction. Here we'll just use set/update with optimistic checks if needed,
    // but since it's single user writing to their own node, simple logic is fine.

    // However, we can't easily "read" here without async. 
    // So we will assume the caller (Context) handles the throttling check or we do a transaction.
    // Let's use a transaction for safety and throttling.

    runTransaction(userRef, (currentData: any) => {
        if (!currentData) return currentData; // Should be initialized already

        const now = Date.now();
        const lastTime = currentData.lastXpTime || 0;
        const xpInLastMinute = (now - lastTime > 60000) ? 0 : (currentData.xpInLastMinute || 0);

        if (xpInLastMinute >= 30) {
            // Throttled
            return; // Abort transaction
        }

        const newXpTotal = (currentData.xp || 0) + xpToAdd;
        let newLevel = currentData.level || 1;

        // Level up logic: Level * 100 XP needed for next level
        // e.g. Level 1 -> 2 needs 100 XP. Total XP 100.
        // Level 2 -> 3 needs 200 XP. Total XP 300.
        // Simple formula: XP needed for level L is 100 * (L-1) * L / 2 ? No, let's stick to the plan.
        // Plan: "Level * 100 XP needed for next level"
        // This usually means cumulative. 
        // Let's use a simple threshold: Level N requires 100 * N * (N-1) / 2 total XP? 
        // Or just: Next level threshold = Current Level * 100.
        // Let's keep it simple: Threshold for Level N+1 = Threshold(N) + N*100.

        // Actually, let's just calculate level from total XP to be stateless.
        // Level 1: 0-99
        // Level 2: 100-299 (Need 100)
        // Level 3: 300-599 (Need 200)
        // Level 4: 600-999 (Need 300)

        // Inverse calculation is complex. Let's just increment level if we hit the target.
        const xpForNextLevel = newLevel * 100;
        // We track "current level XP" or "total XP"? 
        // Let's track Total XP.

        // We need to know how much XP was needed for current level to know if we passed next.
        // Let's simplify: 
        // XP required to reach Level L = 50 * L * (L-1).
        // L=1: 0
        // L=2: 100
        // L=3: 300
        // L=4: 600

        // Check if newXpTotal >= 50 * (newLevel + 1) * newLevel
        const nextLevelThreshold = 50 * (newLevel + 1) * newLevel;

        if (newXpTotal >= nextLevelThreshold) {
            newLevel++;
        }

        return {
            ...currentData,
            xp: newXpTotal,
            level: newLevel,
            title: getTitleForLevel(newLevel),
            lastXpTime: now,
            xpInLastMinute: xpInLastMinute + xpToAdd
        };
    });
};
