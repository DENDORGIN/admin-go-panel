// ChatRoom.tsx

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import {
    Box,
    VStack,
    Text,
    Flex,
    useDisclosure
} from "@chakra-ui/react";

import useAuth from "../../../hooks/useAuth";
import { getSortedUsers, getOnlineUserIds } from "../../../utils/sortedUsers";
import { useChatSocket } from "../../../hooks/useChatSocket";
import { MessageType } from "../../../client";

import FilePreviewModal from "../../../components/Modals/FilePreviewModal";
import MessageBubble from "../../../components/Chat/Messages";
import InputBar from "../../../components/Chat/InputBar";
import UserList from "../../../components/Chat/UserList";

import sendMessageIcon from "@/assets/images/send-message.svg";
import { MediaService } from "../../../client";
import { RoomType } from "../rooms";

export const Route = createFileRoute("/_layout/chat/$roomId")({
    component: ChatRoom,
});

function ChatRoom() {
    const { user } = useAuth();
    const { roomId } = useParams({ from: "/_layout/chat/$roomId" });
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; preview: string; file: File }[]>([]);
    const [fileMessage, setFileMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const {
        isOpen: isFileModalOpen,
        onOpen: onFileModalOpen,
        onClose: onFileModalClose
    } = useDisclosure();

    const rooms: RoomType[] | undefined = queryClient.getQueryData(["rooms"]);
    const room = rooms?.find(room => room.ID === roomId);
    const roomName = room?.name_room || "Невідома кімната";
    const isRoomClosed = room?.status === false;
    const isChannel = room?.is_channel ?? false;
    const isOwner = user?.ID && room?.owner_id === user.ID;

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
    });

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const isAtBottom =
            container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

        if (isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    const sendMessage = () => {
        if (isInteractionDisabled || !user) return;
        if (ws.current && ws.current.readyState === WebSocket.OPEN && input.trim()) {
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
            setInput("");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || isInteractionDisabled || !user) {
            console.warn("🚫 Завантаження файлів заборонено");
            return;
        }

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
        if (!files.length || !user || isInteractionDisabled) {
            console.warn("🚫 Відправка файлів заборонена");
            return;
        }

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
                    borderWidth={1}
                    borderRadius="lg"
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
                        p={4} // залишив тільки тут
                    >

                    {messages.map((msg, index) => (
                            <MessageBubble
                                key={msg.id}
                                msg={msg}
                                isMe={msg.user_id === user?.ID}
                                isLast={index === messages.length - 1}
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
                />
            </Flex>
        </Flex>
    );
}

export default ChatRoom;