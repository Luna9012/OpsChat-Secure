export interface User {
    id: string | number;
    username: string;
    name?: string;
    status?: string;
    bio?: string;
    avatar?: string;
    avatarColor?: string;
    role?: string;
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    senderAvatarColor?: string;
    createdAt: string;
    channelId: string;
    type: 'text' | 'image' | 'voice' | 'system';
}

export interface Channel {
    id: string;
    name: string;
    type: 'public' | 'private';
    unreadCount?: number;
}

export interface Workspace {
    id: string;
    name: string;
    channels: Channel[];
}

export type ViewState = {
    type: 'channel' | 'dm' | null;
    id: string | number | null;
};