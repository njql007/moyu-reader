import { joinRoom } from 'trystero/torrent';

export interface SocialActivity {
    id: string;
    user: string;
    action: string;
    target?: string;
    timestamp: number;
}

class BroadcastService {
    private room: any;
    private sendActivityAction: any;
    private activityListeners: ((activity: SocialActivity) => void)[] = [];
    private presenceListeners: ((count: number) => void)[] = [];
    private peers: Set<string> = new Set();
    private selfId: string;

    constructor() {
        // Config: App ID (must be unique to this app)
        const config = { appId: 'moyu_reader_global_v1' };

        // Join a global room
        this.room = joinRoom(config, 'global_room');
        this.selfId = this.room.getPeers().selfId;

        // --- Presence Handling ---
        this.room.onPeerJoin((peerId: string) => {
            console.log('Peer joined:', peerId);
            this.peers.add(peerId);
            this.notifyPresence();
        });

        this.room.onPeerLeave((peerId: string) => {
            console.log('Peer left:', peerId);
            this.peers.delete(peerId);
            this.notifyPresence();
        });

        // --- Activity Handling ---
        // Create a data channel for 'activity'
        const [send, get] = this.room.makeAction('activity');
        this.sendActivityAction = send;

        // Listen for incoming activities
        get((data: SocialActivity, peerId: string) => {
            console.log('Received activity from', peerId, data);
            this.notifyActivity(data);
        });
    }

    private notifyPresence() {
        // Count peers + self (1)
        const count = this.peers.size + 1;
        this.presenceListeners.forEach(cb => cb(count));
    }

    private notifyActivity(activity: SocialActivity) {
        this.activityListeners.forEach(cb => cb(activity));
    }

    // --- Public API ---

    public onPresenceChange(callback: (count: number) => void) {
        this.presenceListeners.push(callback);
        // Initial call
        callback(this.peers.size + 1);
        return () => {
            this.presenceListeners = this.presenceListeners.filter(cb => cb !== callback);
        };
    }

    public onActivity(callback: (activity: SocialActivity) => void) {
        this.activityListeners.push(callback);
        return () => {
            this.activityListeners = this.activityListeners.filter(cb => cb !== callback);
        };
    }

    public sendActivity(action: string, target?: string) {
        const activity: SocialActivity = {
            id: Math.random().toString(36).substring(2),
            user: 'Anonymous Reader',
            action,
            target,
            timestamp: Date.now()
        };

        // Notify local listeners immediately (so I see my own activity)
        this.notifyActivity(activity);

        // Broadcast to P2P peers
        if (this.sendActivityAction) {
            this.sendActivityAction(activity);
        }
    }

    public cleanup() {
        if (this.room) {
            this.room.leave();
        }
    }
}

// Export singleton
export const broadcastService = new BroadcastService();
