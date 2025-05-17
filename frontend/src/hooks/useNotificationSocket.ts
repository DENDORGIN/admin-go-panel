import { useEffect, useRef } from "react";
import { getWsUrl } from "../utils/urls";
import useAuth from "../hooks/useAuth";


export interface NotificationMessage {
    type: string;
    payload: {
        title: string;
        body: string;
        type: string;
        sent_at: string;
        meta?: Record<string, any>;
    };
}

export function useNotificationSocket(onMessage: (msg: NotificationMessage) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading || !user) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        const wsUrl = getWsUrl("notifications", { token });
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onerror = () => {
            console.error("❌ Socket error. Retrying in 5s...");
            setTimeout(() => {
                socketRef.current = new WebSocket(wsUrl);
            }, 5000);
        };

        socket.onopen = () => {
            console.log("✅ Notification socket connected");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📥 Notification received:", data);
            onMessage(data);
        };

        socket.onclose = () => {
            console.log("❌ Notification socket disconnected");
        };

        return () => {
            socket.close();
        };
    }, [user, isLoading]);

    return socketRef;
}
