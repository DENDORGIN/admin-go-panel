import { useEffect, useRef } from "react";
import { getWsUrl } from "../utils/urls";
import {DirectChat, DirectMessage, UserPublic} from "../client";

interface UseDirectSocketProps {
    user: any;
    selectedUser: UserPublic | null;
    onNewMessage: (msg: DirectMessage) => void;
    setMessages: (messages: DirectMessage[] | ((prev: DirectMessage[]) => DirectMessage[])) => void;
    setEditingMessageId: (id: string | null) => void;
    setInput: (value: string) => void;
    setChatId: (id: string) => void;
}

export function useDirectSocket({
                                    user,
                                    selectedUser,
                                    setMessages,
                                    onNewMessage,
                                    setChatId,
                                    // setEditingMessageId,
                                    // setInput
                                }: UseDirectSocketProps) {
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!selectedUser || !user) return;

        const connect = async () => {
            try {
                const chat: DirectChat = await import("../client").then((mod) =>
                    mod.DirectService.getOrPostChats({ user_id: selectedUser.ID })
                );

                const chatId = chat.ID;
                setChatId(chat.ID);
                const token = localStorage.getItem("access_token")!;
                const wsUrl = getWsUrl(`direct/chats/${chatId}`, { token });
                const socket = new WebSocket(wsUrl);

                socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    if (Array.isArray(data)) {
                        setMessages(data);
                    } else if (data.type === "new_message") {
                        setMessages((prev) => [...prev, data.message]);
                    } else if (data.type === "update_message") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.ID === data.id ? { ...m, ContentUrl: data.content_url, isLoading: false } : m
                            )
                        );
                    } else if (data.type === "message_reactions_updated") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.ID === data.message.ID ? { ...m, Reaction: data.message.Reaction } : m
                            )
                        );
                    } else if (data.type === "message_edited") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.ID === data.message.ID ? { ...m, Message: data.message.Message, EditedAt: data.message.EditedAt } : m
                            )
                        );
                    } else if (data.message !== undefined) {
                        onNewMessage({ ...data, isLoading: false });
                    }
                };

                socketRef.current?.close();
                socketRef.current = socket;
            } catch (error) {
                console.error("❌ Не вдалося створити або отримати чат:", error);
            }
        };

        connect();

        return () => {
            socketRef.current?.close();
        };
    }, [selectedUser, user]);

    return socketRef;
}