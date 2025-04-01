import { useEffect, useRef } from "react";
import { getWsUrl } from "../utils/urls.ts";
import { MessageType } from "../client";

interface UseChatSocketProps {
    roomId: string;
    token: string | null;
    user: {
        ID: string;
        fullName: string;
        avatar: string;
    } | null;
    onMessagesUpdate: (msgs: MessageType[]) => void;
    onNewMessage: (msg: MessageType) => void;
    onMessageUpdate: (msg: Partial<MessageType> & { id: string }) => void;
    onMessageDelete?: (id: string) => void;
}

export const useChatSocket = ({
                                  roomId,
                                  token,
                                  user,
                                  onMessagesUpdate,
                                  onNewMessage,
                                  onMessageUpdate,
                              }: UseChatSocketProps) => {
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isUnmounted = useRef(false);

    const connect = () => {
        if (!token || !user?.ID) return;

        const wsUrl = getWsUrl("chat", { token, room_id: roomId });
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        console.log("🌐 Підключення до WebSocket:", wsUrl);

        socket.onopen = () => {
            console.log("✅ WebSocket відкрито");
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (Array.isArray(data)) {
                    onMessagesUpdate(data);
                } else if (data?.type === "update_message") {
                    onMessageUpdate(data);
                } else if (data?.type === "message_reactions_updated") {
                    const { message_id, reactions } = data;
                    onMessageUpdate({ id: message_id, reactions });
                } else if (data?.type === "message_edited") {
                    onMessageUpdate(data.message);
                } else if (data.message !== undefined) {
                    onNewMessage({ ...data, isLoading: false });
                }
            } catch (err) {
                console.error("❌ WS error:", err);
            }
        };

        socket.onclose = (event) => {
            console.warn("❌ WebSocket закрито. Код:", event.code, "Причина:", event.reason);
            if (!isUnmounted.current) {
                reconnectTimer.current = setTimeout(() => {
                    console.log("🔄 Спроба повторного підключення...");
                    connect();
                }, 3000);
            }
        };

        socket.onerror = (error) => {
            console.error("⚠️ WebSocket помилка:", error);
        };
    };

    useEffect(() => {
        isUnmounted.current = false;
        connect();

        return () => {
            isUnmounted.current = true;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            ws.current?.close();
            ws.current = null;
        };
    }, [roomId, token, user?.ID]);

    return ws;
};
