export interface RawMessageUser {
    user_id: string;
    full_name: string;
    avatar: string;
    created_at: string;
}

export interface SortedUser {
    id: string;
    full_name: string;
    avatar: string;
    lastMessageTime: number;
}

export const getSortedUsers = (messages: RawMessageUser[]): SortedUser[] => {
    const userActivityMap = new Map<string, SortedUser>();

    messages.forEach((msg) => {
        const timestamp = new Date(msg.created_at).getTime();
        userActivityMap.set(msg.user_id, {
            id: msg.user_id,
            full_name: msg.full_name,
            avatar: msg.avatar,
            lastMessageTime: timestamp,
        });
    });

    return Array.from(userActivityMap.values()).sort(
        (a, b) => b.lastMessageTime - a.lastMessageTime
    );
};

export const getOnlineUserIds = (users: SortedUser[]): string[] => {
    const now = Date.now();
    return users
        .filter((user) => now - user.lastMessageTime < 5 * 60 * 1000)
        .map((user) => user.id);
};