import {
    Avatar, Badge,
    Box,
    Flex,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";

import {createFileRoute} from "@tanstack/react-router";
import {useEffect, useRef, useState} from "react";
import {DirectService, MediaService, type CreateDirectChatPayload, type DirectChat, type UserPublic,} from "../../client";
import {getWsUrl} from "../../utils/urls";
import DirectMessageBubble from "../../components/Direct/DirectMessage";
import useAuth from "../../hooks/useAuth.ts";
import DirectInputBar from "../../components/Direct/DirectInputBar";



type Message = {
    type?: string;
    ID: string;
    SenderID: string;
    ChatID: string;
    Message: string;
    CreatedAt: string;
    EditedAt?: string | null;
    Reaction?: string;
    ContentUrl?: string[];
    isLoading?: boolean;
};

export const Route = createFileRoute("/_layout/direct")({
    component: DirectPage,
});

function DirectPage() {
    const [users, setUsers] = useState<UserPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    const {user} = useAuth();

    useEffect(() => {
        const cancelable = DirectService.readUsers();
        cancelable
            .then(setUsers)
            .catch((err) => {
                if (err.name !== "CancelError") console.error("❌ readUsers error", err);
            })
            .finally(() => setLoading(false));

        return () => cancelable.cancel?.();
    }, []);

    const openChatWithUser = async (user: UserPublic) => {
        setSelectedUser(user);
        setMessages([]);
        const payload: CreateDirectChatPayload = {user_id: user.ID};

        try {
            const chat: DirectChat = await DirectService.getOrPostChats(payload);
            const chatId = chat.ID;
            const token = localStorage.getItem("access_token")!;
            const wsUrl = getWsUrl(`direct/chats/${chatId}`, {token});
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
                            m.ID === data.id ? {...m, ContentUrl: data.content_url, isLoading: false} : m
                        )
                    );
                } else if (data.type === "message_reactions_updated") {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.ID === data.message.ID ? {...m, Reaction: data.message.Reaction} : m
                        )
                    );
                } else if (data.type === "message_edited") {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.ID === data.message.ID ? {...m, Message: data.message.Message, EditedAt: data.message.EditedAt} : m
                        )
                    );
                }
            };

            socketRef.current?.close();
            socketRef.current = socket;
        } catch (error) {
            console.error("❌ Не вдалося створити або отримати чат:", error);
        }
    };


    const handleSend = () => {
        if (!input.trim() || !socketRef.current) return;

        if (editingMessageId) {
            socketRef.current.send(
                JSON.stringify({type: "edit_message", id: editingMessageId, message: input.trim()})
            );
            setEditingMessageId(null);
        } else {
            socketRef.current.send(
                JSON.stringify({type: "new_message", message: input.trim()})
            );
        }

        setInput("");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user || !selectedUser || !socketRef.current) return;

        const messageId = crypto.randomUUID();
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append("files", file));

        // 👉 крок 1: надіслати повідомлення на сервер
        // socketRef.current?.send(JSON.stringify(placeholderMessage));


        // 👉 крок 2: локально показати плейсхолдер
        const placeholderMessage: Message = {
            ID: messageId,
            SenderID: user.ID,
            ChatID: "",
            Message: input,
            CreatedAt: new Date().toISOString(),
            Reaction: "",
            ContentUrl: [],
            isLoading: true,
        };
        setMessages(prev => [...prev, placeholderMessage]);

        socketRef.current?.send(JSON.stringify(placeholderMessage));

        try {
            const res = await MediaService.downloadImages(messageId, formData);
            const fileUrls = res.map((f: { url: string }) => f.url);

            socketRef.current.send(JSON.stringify({
                type: "update_message",
                id: messageId,
                content_url: fileUrls,
            }));
        } catch (err) {
            console.error("Upload error:", err);
        }
    };


    return (
        <Flex h="100vh" w="full" maxW="1920px" overflow="hidden">
            <Box w="320px" bg="gray.100" borderRight="1px" borderColor="gray.300" px={4} py={6} overflowY="auto">
                <Text fontSize="lg" fontWeight="semibold" mb={4} pt={8}>
                    Користувачі
                </Text>
                {loading ? (
                    <Flex justify="center" mt={4}><Spinner size="sm"/></Flex>
                ) : (
                    <VStack align="stretch" spacing={2}>
                        {users.map((user) => (
                            <Flex
                                key={user.ID}
                                align="center"
                                gap={3}
                                p={2}
                                borderRadius="md"
                                _hover={{bg: "gray.200"}}
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
                                        <Text fontWeight="medium">{user.fullName ?? user.email}</Text>
                                        <Badge colorScheme={
                                            user.isSuperUser ? "green" : user.isAdmin ? "blue" : user.isActive ? "yellow" : "red"
                                        }>
                                            {user.isSuperUser ? "SuperUser" : user.isAdmin ? "Admin" : user.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </Flex>
                                    <Text fontSize="sm" color="gray.500">{user.email}</Text>
                                </Box>
                            </Flex>
                        ))}
                    </VStack>
                )}
            </Box>

            <Flex direction="column" flex="1" h="full" maxH="100vh" overflow="hidden" px={4} py={6}>
                {selectedUser ? (
                    <>
                        <Box flexShrink={0} pt={8} px={4}>
                            <Text fontSize="xl" fontWeight="bold">
                                Чат з {selectedUser.fullName ?? selectedUser.email}
                            </Text>
                        </Box>

                        <VStack spacing={3} align="stretch" px={4} flex="1" overflowY="auto">
                            {messages.map((msg, idx) => (
                                <DirectMessageBubble
                                    key={msg.ID}
                                    msg={msg}
                                    isMe={msg.SenderID === user?.ID}
                                    isLast={idx === messages.length - 1}
                                    onEdit={() => {
                                        setEditingMessageId(msg.ID);
                                        setInput(msg.Message);
                                    }}
                                    onDelete={(id) => console.log("Delete", id)}
                                    onReact={(id, emoji) => {
                                        socketRef.current?.send(
                                            JSON.stringify({type: "add_reaction", message_id: id, reaction: emoji})
                                        );
                                    }}
                                    onImageClick={(url) => console.log("Image click:", url)}
                                />
                            ))}
                        </VStack>

                        <Box px={4} pt={2} pb={4} flexShrink={0} borderTop="1px solid" borderColor="gray.200">
                            <DirectInputBar
                                ref={inputRef}
                                value={input}
                                onChange={setInput}
                                onSend={handleSend}
                                onFileSelect={handleFileUpload}
                                disabled={!selectedUser || !user}
                            />
                            {editingMessageId && (
                                <Text color="teal.500" fontSize="sm" mt={1} px={2}>
                                    ✏️ Ви редагуєте повідомлення
                                    <span
                                        style={{cursor: "pointer", marginLeft: 10, color: "red"}}
                                        onClick={() => {
                                            setEditingMessageId(null);
                                            setInput("");
                                        }}
                                    >
                                        Скасувати
                                    </span>
                                </Text>
                            )}
                        </Box>
                    </>
                ) : (
                    <Flex align="center" justify="center" flex="1">
                        <Text color="gray.500" fontSize="lg">
                            Виберіть співрозмовника, щоб почати чат
                        </Text>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
}

