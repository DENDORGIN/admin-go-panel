import { useState } from "react";
import { AppNotification } from "../client";

export function useNotificationStore() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotification = (notif: AppNotification) => {
        setNotifications((prev) => [notif, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
    };
}
