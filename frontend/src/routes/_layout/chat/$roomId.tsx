import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Box, Input, Button, VStack, HStack, Text, Flex, useColorModeValue } from "@chakra-ui/react";
import useAuth from "../../../hooks/useAuth";
import { RoomType } from "../rooms";
import { useBreakpointValue } from "@chakra-ui/react";
import MessageBubble from "../../../components/Chat/Messages.tsx"; // ✅ Імпортуємо компонент повідомлень

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

    const chatWidth = useBreakpointValue({ base: "100%", md: "80%", lg: "50%" });

    // ✅ Отримуємо список кімнат із кешу
    const rooms: RoomType[] | undefined = queryClient.getQueryData(["rooms"]);
    const room = rooms?.find(room => room.ID === roomId);
    const roomName = room?.name_room || "Невідома кімната";
    const isRoomClosed = room?.status === false;
    const isChannel = room?.is_channel ?? false;
    const isOwner = room?.owner_id === user?.ID;

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
        if ((isChannel && !isOwner) || isRoomClosed) return;

        if (ws.current && ws.current.readyState === WebSocket.OPEN && input.trim()) {
            const message = {
                id: crypto.randomUUID(),
                user_id: user?.ID,
                full_name: user?.fullName,
                room_id: roomId,
                message: input,
                created_at: new Date().toISOString(),
            };
            ws.current.send(JSON.stringify(message));
            setInput("");
        }
    };

    // 🎨 Додаємо підтримку темної теми
    const inputBg = useColorModeValue("white", "gray.700");
    const inputColor = useColorModeValue("black", "white");
    const inputBorder = useColorModeValue("gray.300", "gray.600");

    return (
        <Flex direction="column" h="97vh" w={chatWidth} maxW="1920px" p={6} mx="auto">
            <Text fontSize="3xl" color="orange.500" p={3} textAlign="center">
                {roomName} {isRoomClosed && " (CLOSED)"} {isChannel && " (CHANNEL)"}
            </Text>
            <Box flex="1" borderWidth={1} borderRadius="lg" boxShadow="md" overflow="hidden" p={4} w="100%">
                <VStack spacing={5} align="stretch" flex="1" overflowY="auto" p={4} maxH="calc(100vh - 150px)">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} isMe={msg.user_id === user?.ID} />
                    ))}
                    <div ref={messagesEndRef} />
                </VStack>
            </Box>

            {/* ✅ Відображаємо форму тільки якщо чат відкритий */}
            {isRoomClosed ? (
                <Box textAlign="center" color="red.500" fontWeight="bold" p={4}>
                    Chat is closed for new messages
                </Box>
            ) : isChannel && !isOwner ? (
                <Box textAlign="center" color="gray.500" fontWeight="bold" p={4}>
                    Only the owner can send messages in this channel.
                </Box>
            ) : (
                <HStack mt={4} p={2} borderTop="1px solid lightgray" bg={useColorModeValue("white", "gray.800")} w="100%">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Send message..."
                        flex="1"
                        isDisabled={isRoomClosed || (isChannel && !isOwner)}
                        bg={inputBg}
                        color={inputColor}
                        borderColor={inputBorder}
                        _placeholder={{ color: useColorModeValue("gray.500", "gray.400") }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <Button onClick={sendMessage} variant="primary" isDisabled={isRoomClosed || (isChannel && !isOwner)}>
                        Send
                    </Button>
                </HStack>
            )}
        </Flex>
    );
}

export default ChatRoom;
