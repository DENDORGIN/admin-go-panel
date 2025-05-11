// import { useEffect, useRef, useState } from "react";
// import { DirectService, type CreateDirectChatPayload, type DirectChat } from "../client";
// import { getWsUrl } from "../utils/urls";
//
// type Message = {
//     ID: string;
//     SenderID: string;
//     Message: string;
//     CreatedAt: string;
//     EditedAt?: string | null;
//     Reaction?: string;
// };
//
// export function useDirectChat(userId: string | null) {
//     const [chatId, setChatId] = useState<string | null>(null);
//     const [messages, setMessages] = useState<Message[]>([]);
//     const socketRef = useRef<WebSocket | null>(null);
//
//     useEffect(() => {
//         if (!userId) return;
//
//         const connect = async () => {
//             setMessages([]);
//
//             const payload: CreateDirectChatPayload = { user_id: userId };
//             const chat: DirectChat = await DirectService.getOrPostChats(payload);
//             setChatId(chat.ID);
//
//             const token = localStorage.getItem("access_token")!;
//             const wsUrl = getWsUrl(`direct/chats/${chat.ID}`, { token });
//             const socket = new WebSocket(wsUrl);
//
//             socket.onmessage = (event) => {
//                 const data = JSON.parse(event.data);
//                 if (Array.isArray(data)) {
//                     setMessages(data);
//                 } else if (data.type === "new_message") {
//                     setMessages((prev) => [...prev, data.message]);
//                 } else if (data.type === "edit_message") {
//                     setMessages((prev) =>
//                         prev.map((m) => (m.ID === data.message.ID ? data.message : m))
//                     );
//                 } else if (data.type === "delete_message") {
//                     setMessages((prev) => prev.filter((m) => m.ID !== data.id));
//                 } else if (data.type === "add_reaction") {
//                     setMessages((prev) =>
//                         prev.map((m) => (m.ID === data.message.ID ? data.message : m))
//                     );
//                 }
//             };
//
//             socketRef.current?.close();
//             socketRef.current = socket;
//         };
//
//         connect().catch(console.error);
//
//         return () => {
//             socketRef.current?.close();
//             socketRef.current = null;
//         };
//     }, [userId]);
//
//     const sendReaction = (messageId: string, emoji: string) => {
//         socketRef.current?.send(
//             JSON.stringify({
//                 type: "add_reaction",
//                 message_id: messageId,
//                 reaction: emoji,
//             })
//         );
//     };
//
//     return { messages, sendReaction };
// }
