// ChatRoom.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import {
    Box, VStack, Text, Flex, useDisclosure, Spinner, Button
} from "@chakra-ui/react";
import { ArrowDownIcon } from "@chakra-ui/icons"
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

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useColorModeValue } from "@chakra-ui/react";

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

    const topBarBg = useColorModeValue("rgba(255, 255, 255, 0)", "rgba(26, 32, 44, 0)");
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);


    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; preview: string; file: File }[]>([]);
    const [fileMessage, setFileMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    const {
        isOpen: isFileModalOpen,
        onOpen: onFileModalOpen,
        onClose: onFileModalClose
    } = useDisclosure();

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);

    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});



    const handleLoadMore = () => {
        if (!messages.length || !ws.current) return;

        setIsLoadingMore(true);

        ws.current.send(JSON.stringify({
            type: "load_more_messages",
            before: messages[0].id,
            limit: 25
        }));

    };



    const getAllImagesFromMessages = (messages: MessageType[]) => {
        return messages.flatMap((msg) =>
            (msg.content_url || []).filter((url) =>
                url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            )
        );
    };

    const handleImageClick = (clickedUrl: string) => {
        const allImages = getAllImagesFromMessages(messages);
        const index = allImages.findIndex((url) => url === clickedUrl);

        if (index !== -1) {
            setLightboxImages(allImages);
            setLightboxIndex(index);
            setLightboxOpen(true);
        }
    };

    const roomName = room?.name_room || "Невідома кімната";
    const isRoomClosed = room?.status === false;
    const isChannel = room?.is_channel ?? false;
    const isOwner = user?.ID && room?.owner_id === user?.ID;
    const isInteractionDisabled = !room || isRoomClosed || (isChannel && !isOwner);

    const sortedUsers = getSortedUsers(messages);
    const onlineIds = getOnlineUserIds(sortedUsers);

    const chatUser = useMemo(() => {
        if (!user?.ID || !user?.fullName || !user?.avatar) return null;
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
        onMessagesUpdate: (msgs) => {
            setMessages((prev) => {
                const newIds = new Set(msgs.map(m => m.id));
                const filtered = prev.filter(m => !newIds.has(m.id));
                return [...filtered, ...msgs]; // ⚠️ не перезаписуємо, а оновлюємо
            });
        },

        onNewMessage: (msg) =>
            setMessages((prev) => {
                const index = prev.findIndex((m) => m.id === msg.id);
                if (index === -1) return [...prev, msg];
                if (JSON.stringify(prev[index]) === JSON.stringify(msg)) return prev; // без змін

                const updated = [...prev];
                updated[index] = { ...msg, isLoading: false };
                return updated;
            }),

        onMessageUpdate: (data) =>
            setMessages((prev) => {
                const index = prev.findIndex((m) => m.id === data.id);
                if (index === -1) return prev;

                const updatedMsg = { ...prev[index], ...data, isLoading: false };
                if (JSON.stringify(prev[index]) === JSON.stringify(updatedMsg)) return prev;

                const updated = [...prev];
                updated[index] = updatedMsg;
                return updated;
            }),

        onMessageDelete: (id: string) => {
            setMessages((prev) => prev.filter((msg) => msg.id !== id));
        },
        onBatchMessages: (batch) => {
            if (!messagesContainerRef.current) return;

            const scrollContainer = messagesContainerRef.current;
            const prevScrollHeight = scrollContainer.scrollHeight;

            setMessages((prev) => [...batch, ...prev]);
            setHasMoreMessages(batch.length === 25);
            setIsLoadingMore(false);

            // ⚠️ Чекаємо DOM-рендер через requestAnimationFrame
            requestAnimationFrame(() => {
                const newScrollHeight = scrollContainer.scrollHeight;
                const diff = newScrollHeight - prevScrollHeight;
                scrollContainer.scrollTop += diff;
            });
        }


    });

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            setShowScrollToBottom(!isNearBottom);
        };

        container.addEventListener("scroll", handleScroll);
        handleScroll(); // виклик одразу при завантаженні

        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, []);



    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollToBottom(false);
    };


    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    const handleEditMessage = (msgId: string, message: string) => {
        setEditingMessageId(msgId);
        setInput(message);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0); // ⏱ гарантія що DOM оновиться
    };

    const sendMessage = () => {
        if (isInteractionDisabled || !user) return;
        if (!input.trim()) return;

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            if (editingMessageId) {
                const editPayload = {
                    type: "edit_message",
                    id: editingMessageId,
                    message: input,
                };
                ws.current.send(JSON.stringify(editPayload));
                setEditingMessageId(null);
            } else {
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

                <Box flex="1" overflow="visible" w="100%" position="relative">
                    {hasMoreMessages && messages.length > 29 && (
                        <Box
                            position="absolute"
                            top="0"
                            left="0"
                            w="100%"
                            textAlign="center"
                            zIndex="10"
                            bg={topBarBg}
                            py={2}
                        >
                            <Button
                                size="xs"
                                borderRadius="full"
                                color="white"
                                colorScheme="cyan"
                                _hover={{ transform: "scale(1.05)" }}
                                _active={{ transform: "scale(0.95)" }}
                                transition="all 0.1s ease-in-out"
                                cursor="pointer"
                                isLoading={isLoadingMore}
                                onClick={handleLoadMore}
                            >
                                Add 25 messages
                            </Button>
                        </Box>
                    )}

                    <VStack
                        ref={messagesContainerRef}
                        overflowY="auto"
                        spacing={4}
                        align="stretch"
                        h="full"
                        maxH="calc(100vh - 180px)"
                        pt={hasMoreMessages && messages.length > 30 ? 50 : 0} // відступ під кнопку
                        p={4}
                        css={{
                            '&::-webkit-scrollbar': { width: '0px' },
                            scrollbarWidth: 'none',
                        }}
                    >

                        {messages.map((msg, index) => (
                            <div
                                key={msg.id}
                                ref={(el) => {
                                    messageRefs.current[msg.id] = el;
                                }}
                            >
                            <MessageBubble
                                user={user}
                                key={msg.id}
                                msg={msg}
                                isMe={msg.user_id === user?.ID}
                                isLast={index === messages.length - 1}
                                onDelete={(id) => {
                                    ws.current?.send(JSON.stringify({ type: "delete_message", id }));
                                    setMessages(prev => prev.filter(m => m.id !== id));
                                }}
                                onEdit={() => handleEditMessage(msg.id, msg.message ?? "")}
                                onReact={(id, emoji) => {
                                    ws.current?.send(JSON.stringify({
                                        type: "add_reaction",
                                        message_id: id,
                                        emoji,
                                    }));
                                }}
                                onImageClick={handleImageClick}
                            />
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </VStack>
                    {showScrollToBottom && (
                        <Box
                            position="absolute"
                            bottom="20px"
                            left="50%"
                            transform="translateX(-50%)"
                            zIndex="10"
                            bg="cyan.500"
                            color="white"
                            borderRadius="full"
                            px={4}
                            py={2}
                            cursor="pointer"
                            boxShadow="lg"
                            _hover={{ bg: "cyan.600" }}
                            onClick={scrollToBottom}
                            animation="fadeSlideUp 0.3s ease"
                        >
                            <ArrowDownIcon />
                        </Box>
                    )}


                </Box>

                <Lightbox
                    open={lightboxOpen}
                    close={() => setLightboxOpen(false)}
                    index={lightboxIndex}
                    slides={lightboxImages.map((src) => ({ src }))}
                    controller={{ closeOnBackdropClick: true }}
                />

                <InputBar
                    ref={inputRef}
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
