import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Box, Input, Button, VStack, HStack, Text, Flex } from "@chakra-ui/react";
import useAuth from "../../../hooks/useAuth";
import { RoomType } from "../rooms";

export const Route = createFileRoute("/_layout/chat/$roomId")({
    component: ChatRoom,
});

// 🔹 Типізація повідомлення
interface MessageType {
    id: string;
    user_id: string;
    full_name: string;
    room_id: string;
    message: string;
    created_at: string;
}



function ChatRoom() {
    const { user } = useAuth();
    const { roomId } = useParams({ from: "/_layout/chat/$roomId" });
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState("");
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // ✅ Отримуємо список кімнат із кешу
    const rooms: RoomType[] | undefined = queryClient.getQueryData(["rooms"]);
    const roomName = rooms?.find(room => room.ID === roomId)?.name_room || "Невідома кімната";

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("JWT токен не знайдено!");
            return;
        }

        const wsUrl = `ws://localhost:5180/ws/chat?token=${token}&room_id=${roomId}`;
        console.log("🔗 Підключення до:", wsUrl);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("✅ WebSocket відкрито");
        };

        ws.current.onmessage = (event) => {
            try {
                const receivedData = JSON.parse(event.data);

                // Якщо це масив (тобто історія повідомлень)
                if (Array.isArray(receivedData)) {
                    console.log("📜 Отримано історію повідомлень:", receivedData);
                    setMessages(receivedData);
                }
                // Якщо це окреме повідомлення
                else if (receivedData && receivedData.message) {
                    console.log("📩 Нове повідомлення:", receivedData);
                    setMessages((prev) => [...prev, receivedData]);
                }
            } catch (error) {
                console.error("❌ Помилка парсингу повідомлення:", error);
            }
        };

        ws.current.onclose = (event) => {
            console.warn("❌ WebSocket закрито. Код:", event.code, "Причина:", event.reason);
        };

        ws.current.onerror = (error) => {
            console.error("⚠️ WebSocket помилка:", error);
        };

        return () => {
            if (ws.current) {
                console.log("🔌 Закриваємо WebSocket...");
                ws.current.close();
                ws.current = null;
            }
        };
    }, [user, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && input.trim()) {
            const message = { id: crypto.randomUUID(), user_id: user?.ID,
                full_name: user?.fullName, room_id: roomId,
                message: input, created_at: new Date().toISOString() };
            ws.current.send(JSON.stringify(message));
            setInput("");
        }
    };

    return (
        <Flex direction="column" w="100%" h="97vh" p={6}>
            <Box flex="1" borderWidth={1} borderRadius="lg" boxShadow="md" overflow="hidden">
                <Text fontSize="2xl" p={4} borderBottom="1px solid lightgray">
                    Chat Room: {roomName}
                </Text>
                <VStack spacing={5} align="stretch" flex="1" overflowY="auto" p={4} maxH="calc(100vh - 150px)">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} isMe={msg.user_id === user?.ID} />
                    ))}
                    <div ref={messagesEndRef} />
                </VStack>
            </Box>
            <HStack mt={4} p={2} borderTop="1px solid lightgray" bg="white">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Send message..." flex="1" />
                <Button onClick={sendMessage} colorScheme="blue">Send</Button>
            </HStack>
        </Flex>
    );
}

// ✅ Компонент повідомлення
function MessageBubble({ msg, isMe }: { msg: MessageType; isMe: boolean }) {
    return (
        <Flex justify={isMe ? "flex-end" : "flex-start"}>
            <Box
                bg={isMe ? "blue.500" : "gray.200"}
                color={isMe ? "white" : "black"}
                p={3}
                borderRadius="lg"
                maxW="70%"
            >
                <Text fontSize="sm" fontWeight="bold">
                    {isMe ? "Ви" : msg.full_name}
                </Text>
                <Text>{msg.message}</Text>
                <Text fontSize="xs" color={isMe ? "white" : "gray.500"} mt={1}>
                    {new Date(msg.created_at).toLocaleTimeString("pl-PL", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                    })}
                </Text>
            </Box>
        </Flex>
    );
}

export default ChatRoom;
