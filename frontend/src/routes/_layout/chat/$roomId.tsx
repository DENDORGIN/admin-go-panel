// ChatRoom.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import {
    Box, VStack, Text, Flex, useDisclosure, Spinner, Button
} from "@chakra-ui/react";

import useAuth from "../../../hooks/useAuth";
import { getSortedUsers, getOnlineUserIds } from "../../../utils/sortedUsers";
import { useChatSocket } from "../../../hooks/useChatSocket";
import { MessageType, RoomService } from "../../../client";

import FilePreviewModal from "../../../components/Modals/FilePreviewModal";
import MessageBubble from "../../../components/Chat/Messages";
import InputBar from "../../../components/Chat/InputBar";
import UserList from "../../../components/Chat/UserList";

import sendMessageIcon from "@/assets/images/send-message.svg";
import { MediaService } from "../../../client";

export const Route = createFileRoute("/_layout/chat/$roomId")({
    component: ChatRoom,
});

function ChatRoom() {
    const { user } = useAuth();
    const { roomId } = useParams({ from: "/_layout/chat/$roomId" });

    const { data: room, isLoading, isError } = useQuery({
        queryKey: ["room", roomId],
        queryFn: () => RoomService.readRoomById(roomId),
        enabled: !!roomId,
    });

    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; preview: string; file: File }[]>([]);
    const [fileMessage, setFileMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    const {
        isOpen: isFileModalOpen,
        onOpen: onFileModalOpen,
        onClose: onFileModalClose
    } = useDisclosure();

    const roomName = room?.name_room || "Невідома кімната";
    const isRoomClosed = room?.status === false;
    const isChannel = room?.is_channel ?? false;
    const isOwner = user?.ID && room?.owner_id === user?.ID;
    const isInteractionDisabled = !room || isRoomClosed || (isChannel && !isOwner);

    const sortedUsers = getSortedUsers(messages);
    const onlineIds = getOnlineUserIds(sortedUsers);

    const chatUser = useMemo(() => {
        return user && user.fullName && user.avatar
            ? {
                ID: user.ID,
                fullName: user.fullName ?? "",
                avatar: user.avatar ?? "",
            }
            : null;
    }, [user?.ID, user?.fullName, user?.avatar]);

    const ws = useChatSocket({
        roomId,
        token: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
        user: chatUser,
        onMessagesUpdate: setMessages,
        onNewMessage: (msg) =>
            setMessages((prev) => {
                const exists = prev.some((m) => m.id === msg.id);
                return exists
                    ? prev.map((m) => (m.id === msg.id ? { ...msg, isLoading: false } : m))
                    : [...prev, msg];
            }),
        onMessageUpdate: (data) =>
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === data.id ? { ...msg, ...data, isLoading: false } : msg
                )
            ),
        onMessageDelete: (id: string) => {
            setMessages((prev) => prev.filter((msg) => msg.id !== id));
        },
    });

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
        if (isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    const handleEditMessage = (msgId: string, message: string) => {
        setEditingMessageId(msgId);
        setInput(message);
    };



    const sendMessage = () => {
        if (isInteractionDisabled || !user) return;
        if (!input.trim()) return;

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            if (editingMessageId) {
                // ✏️ Відправляємо запит на редагування
                const editPayload = {
                    type: "edit_message",
                    id: editingMessageId,
                    message: input,
                };
                ws.current.send(JSON.stringify(editPayload));
                setEditingMessageId(null); // виходимо з режиму редагування
            } else {
                // 🆕 Звичайне нове повідомлення
                const message: MessageType = {
                    id: crypto.randomUUID(),
                    user_id: user.ID,
                    full_name: user.fullName ?? "",
                    avatar: user.avatar ?? "",
                    room_id: roomId,
                    message: input,
                    content_url: [],
                    created_at: new Date().toISOString(),
                };
                ws.current.send(JSON.stringify(message));
            }

            setInput("");
        }
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || isInteractionDisabled || !user) return;
        const selectedFiles = Array.from(e.target.files);
        const previews = selectedFiles.map((file) => ({
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            preview: URL.createObjectURL(file),
            file,
        }));
        setFilePreviews(previews);
        setFiles(selectedFiles);
        onFileModalOpen();
    };

    const uploadSelectedFiles = async () => {
        if (!files.length || !user || isInteractionDisabled) return;

        const messageId = crypto.randomUUID();
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));

        const placeholderMessage: MessageType = {
            id: messageId,
            user_id: user.ID,
            full_name: user.fullName ?? "",
            avatar: user.avatar ?? "",
            room_id: roomId,
            message: fileMessage,
            content_url: [],
            created_at: new Date().toISOString(),
            isLoading: true,
        };

        setMessages(prev => [...prev, placeholderMessage]);
        ws.current?.send(JSON.stringify(placeholderMessage));
        onFileModalClose();

        try {
            const res = await MediaService.downloadImages(messageId, formData);
            const fileUrls = res.map((f: { url: string }) => f.url);
            const updateMessage = {
                type: "update_message",
                id: messageId,
                content_url: fileUrls,
            };
            ws.current?.send(JSON.stringify(updateMessage));
            setFiles([]);
            setFilePreviews([]);
            setFileMessage("");
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    if (isLoading) return <Spinner size="xl" mx="auto" mt={12} />;
    if (isError || !room) return <Text textAlign="center" mt={12} color="red.500">Не вдалося завантажити кімнату</Text>;

    return (
        <Flex direction="row" h="96vh" w="100%" maxW="1920px" p={6} mx="auto">
            <UserList users={sortedUsers} onlineIds={onlineIds} />
            <Flex direction="column" flex="1">
                <Text fontSize="3xl" color="orange.500" p={3} textAlign="center">
                    {roomName} {isRoomClosed && " (CLOSED)"} {isChannel && " (CHANNEL)"}
                </Text>

                <Box
                    flex="1"
                    border="none"
                    boxShadow="none"
                    overflowY="auto"
                    p={0}
                    w="100%"
                    maxH="calc(100vh - 180px)"
                >
                    <VStack
                        ref={messagesContainerRef}
                        spacing={4}
                        align="stretch"
                        flex="1"
                        p={4}
                    >
                        {messages.map((msg, index) => (
                            <MessageBubble
                                key={msg.id}
                                msg={msg}
                                isMe={msg.user_id === user?.ID}
                                isLast={index === messages.length - 1}
                                onDelete={(id) => {
                                    ws.current?.send(JSON.stringify({ type: "delete_message", id }));
                                    setMessages(prev => prev.filter(m => m.id !== id));
                                }}
                                onEdit={() => handleEditMessage(msg.id, msg.message ?? "")}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </VStack>
                </Box>

                <InputBar
                    value={input}
                    onChange={setInput}
                    onSend={sendMessage}
                    onFileSelect={handleFileSelect}
                    disabled={isInteractionDisabled}
                    iconSrc={sendMessageIcon}
                />
                {editingMessageId && (
                    <Text color="teal.500" fontSize="sm" mt={1} px={2}>
                        ✏️ Ви редагуєте повідомлення
                        <Button
                            size="xs"
                            ml={2}
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => {
                                setEditingMessageId(null);
                                setInput("");
                            }}
                        >
                            Скасувати
                        </Button>
                    </Text>
                )}

                <FilePreviewModal
                    isOpen={isFileModalOpen}
                    onClose={onFileModalClose}
                    files={filePreviews}
                    onRemove={(i) => {
                        const updated = [...filePreviews];
                        URL.revokeObjectURL(updated[i].preview);
                        updated.splice(i, 1);
                        setFilePreviews(updated);
                        setFiles(updated.map(f => f.file));
                    }}
                    onUpload={uploadSelectedFiles}
                    message={fileMessage}
                    onMessageChange={setFileMessage}
                    isDisabled={isInteractionDisabled}
                    onAddFiles={(newFiles) => {
                        const newPreviews = newFiles.map((file) => ({
                            name: file.name,
                            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                            preview: URL.createObjectURL(file),
                            file,
                        }));

                        setFilePreviews((prev) => [...prev, ...newPreviews]);
                        setFiles((prev) => [...prev, ...newFiles]);
                    }}
                />
            </Flex>
        </Flex>
    );
}

export default ChatRoom;
