import {
    Avatar, Badge,
    Box,
    Flex,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";


import {createFileRoute} from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { DirectService, type UserPublic, type DirectChat, type CreateDirectChatPayload, } from "../../client";
import { getWsUrl } from "../../utils/urls";


type Message = {
    id: string;
    message: string;
    senderId: string;
    createdAt: string;
    reaction?: string;
};

export const Route = createFileRoute("/_layout/direct")({
    component: DirectPage,

});


function DirectPage() {
    const [users, setUsers] = useState<UserPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const socketRef = useRef<WebSocket | null>(null);


    useEffect(() => {
        const cancelable = DirectService.readUsers();
        cancelable
            .then(setUsers)
            .finally(() => setLoading(false));
        return () => cancelable.cancel?.();
    }, []);

    // 👉 при виборі користувача — створюємо/отримуємо чат і відкриваємо WebSocket
    const openChatWithUser = async (user: UserPublic) => {
        setSelectedUser(user);
        setMessages([]);
        const payload: CreateDirectChatPayload = {
            user_id: user.ID,
        };

        try {
            const chat: DirectChat = await DirectService.getOrPostChats(payload);

            const chatId = chat.ID;

            const token = localStorage.getItem("access_token")!;
            const wsUrl = getWsUrl(`direct/chats/${chatId}`, { token });

            const socket = new WebSocket(wsUrl);


            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (Array.isArray(data)) {
                    setMessages(data);
                } else if (data.type === "new_message") {
                    setMessages((prev) => [...prev, data.message]);
                }
            };

            socketRef.current?.close();
            socketRef.current = socket;
        } catch (error) {
            console.error("❌ Не вдалося створити або отримати чат:", error);
        }
    };


    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
                <Text fontSize="lg" fontWeight="semibold" mb={4} pt={12}>
                    Users
                </Text>

                {loading ? (
                    <Flex justify="center" mt={4}>
                        <Spinner size="sm" />
                    </Flex>
                ) : (
                    <VStack align="stretch" spacing={2}>
                        {users.map((user) => (
                            <Flex
                                key={user.ID}
                                align="center"
                                gap={3}
                                p={2}
                                borderRadius="md"
                                _hover={{ bg: "gray.200" }}
                                cursor="pointer"
                                onClick={() => openChatWithUser(user)}
                            >
                                <Avatar
                                    size="sm"
                                    name={user.fullName ?? user.email}
                                    src={user.avatar ?? undefined}
                                />
                                <Box>
                                    <Flex align="center" gap={2}>
                                        <Text fontWeight="medium">
                                            {user.fullName ?? user.email}
                                        </Text>
                                        <Badge
                                            colorScheme={
                                                user.isSuperUser
                                                    ? "green"
                                                    : user.isAdmin
                                                        ? "blue"
                                                        : user.isActive
                                                            ? "yellow"
                                                            : "red"
                                            }
                                        >
                                            {user.isSuperUser
                                                ? "Супер"
                                                : user.isAdmin
                                                    ? "Адмін"
                                                    : user.isActive
                                                        ? "Активний"
                                                        : "Неактивний"}
                                        </Badge>
                                    </Flex>
                                    <Text fontSize="sm" color="gray.500">
                                        {user.email}
                                    </Text>
                                </Box>
                            </Flex>
                        ))}
                    </VStack>
                )}
            </aside>


            {/* Chat area */}
            <main className="flex-1 p-4 overflow-y-auto">
                {selectedUser ? (
                    <>
                        <Text fontSize="xl" fontWeight="bold" mb={4}>
                            Чат з {selectedUser.fullName ?? selectedUser.email}
                        </Text>
                        <VStack spacing={3} align="stretch">
                            {messages.map((msg) => (
                                <Box
                                    key={msg.id}
                                    bg="gray.100"
                                    p={3}
                                    borderRadius="md"
                                    alignSelf={msg.senderId === selectedUser.ID ? "start" : "end"}
                                >
                                    <Text>{msg.message}</Text>
                                    <Text fontSize="xs" color="gray.500">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    </>
                ) : (
                    <div className="text-gray-500 text-lg text-center mt-10">
                        Виберіть співрозмовника, щоб почати чат
                    </div>
                )}
            </main>
        </div>
    );
}