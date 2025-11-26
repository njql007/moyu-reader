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
    orderByChild
} from 'firebase/database';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
const app = isConfigured ? initializeApp(firebaseConfig) : null;
const db = app ? getDatabase(app) : null;

const sessionId = Math.random().toString(36).substring(2, 15);

export interface Activity {
    id?: string;
    user: string;
    action: string;
    target?: string;
    link?: string; // URL to the article
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

export const broadcastActivity = (action: string, target?: string, link?: string) => {
    if (!db) return;

    const activityRef = ref(db, '/activity');
    const newActivityRef = push(activityRef);

    set(newActivityRef, {
        user: 'Anonymous Reader',
        action,
        target: target || '',
        link: link || '',
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
