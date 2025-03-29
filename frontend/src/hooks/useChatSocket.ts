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

    useEffect(() => {
        if (!token || !user) return;

        const wsUrl = getWsUrl("chat", { token, room_id: roomId });
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("✅ WebSocket відкрито");
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (Array.isArray(data)) {
                    onMessagesUpdate(data);
                } else if (data?.type === "update_message") {
                    onMessageUpdate(data);
                } else if (data.message !== undefined) {
                    onNewMessage({ ...data, isLoading: false });
                }
            } catch (err) {
                console.error("❌ WS error:", err);
            }
        };

        ws.current.onclose = (event) => {
            console.warn("❌ WebSocket закрито. Код:", event.code, "Причина:", event.reason);
        };

        ws.current.onerror = (error) => {
            console.error("⚠️ WebSocket помилка:", error);
        };

        return () => {
            ws.current?.close();
            ws.current = null;
        };
    }, [token, user, roomId]);

    return ws;
};