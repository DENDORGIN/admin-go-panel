import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Box, Input, Button, VStack, HStack, Text, Flex } from "@chakra-ui/react";
import useAuth from "../../../hooks/useAuth";

export const Route = createFileRoute("/_layout/chat/$roomId")({
    component: ChatRoom,
});

function ChatRoom() {
    const { user } = useAuth();
    const { roomId } = useParams({ from: "/_layout/chat/$roomId" });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null); // 🔹 Реф для автоматичного скролу

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("JWT токен не знайдено!");
            return;
        }

        const wsUrl = `ws://localhost:5180/ws/chat?token=${token}&chat_id=${roomId}`;
        console.log("🔗 Підключення до:", wsUrl);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("✅ WebSocket відкрито");
        };

        ws.current.onmessage = (event) => {
            console.log("📩 Отримано повідомлення:", event.data);
            setMessages((prev) => [...prev, JSON.parse(event.data)]);
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

    // 🔽 Функція для автоматичного прокручування вниз
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && input.trim()) {
            const message = { sender: user?.ID, text: input };
            ws.current.send(JSON.stringify(message));
            setInput("");
        }
    };

    return (
        <Flex direction="column" h="97vh" w='100%' p={6}>
            {/* Контейнер чату */}
            <Box flex="1" borderWidth={1} borderRadius="lg" boxShadow="md" overflow="hidden">
                <Text fontSize="2xl" p={4} borderBottom="1px solid lightgray">
                    Chat Room: {roomId}
                </Text>

                {/* 🔹 Контейнер для повідомлень */}
                <VStack spacing={5} align="stretch" flex="1" overflowY="auto" p={4} maxH="calc(100vh - 150px)">
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} msg={msg} isMe={msg.sender === user?.ID} />
                    ))}
                    <div ref={messagesEndRef} /> {/* 🔽 Авто-скрол до останнього повідомлення */}
                </VStack>
            </Box>

            {/* 🔹 Поле вводу закріплене внизу */}
            <HStack mt={4} p={2} borderTop="1px solid lightgray" bg="white">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Send message..." flex="1" />
                <Button onClick={sendMessage} colorScheme="blue">Send</Button>
            </HStack>
        </Flex>
    );
}

// ✅ Компонент для повідомлення (ліве/праве вирівнювання)
function MessageBubble({ msg, isMe }) {
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
                    {isMe ? "Ви" : msg.sender}
                </Text>
                <Text>{msg.text}</Text>
            </Box>
        </Flex>
    );
}

export default ChatRoom;
