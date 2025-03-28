import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
    Box,
    Textarea,
    Image,
    Button,
    VStack,
    HStack,
    Text,
    Flex,
    useColorModeValue,
    useDisclosure,
    Tooltip
} from "@chakra-ui/react";
import { AttachmentIcon } from "@chakra-ui/icons";
import sendMessageIcon from '@/assets/images/send-message.svg';
import useAuth from "../../../hooks/useAuth";
import { RoomType } from "../rooms";
import MessageBubble from "../../../components/Chat/Messages.tsx";

import { getWsUrl } from "../../../utils/urls.ts";
import FilePreviewModal from "../../../components/Modals/FilePreviewModal";
import UserProfileModal from "../../../components/Modals/UserProfileModal";
import { MediaService } from "../../../client";

export const Route = createFileRoute("/_layout/chat/$roomId")({
    component: ChatRoom,
});

interface MessageType {
    id: string;
    user_id: string;
    full_name: string;
    avatar: string;
    room_id: string;
    message: string;
    content_url?: string[];
    created_at: string;
    isLoading?: boolean;
}

function ChatRoom() {
    const { user } = useAuth();
    const { roomId } = useParams({ from: "/_layout/chat/$roomId" });
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState("");
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // const chatWidth = useBreakpointValue({ base: "100%", md: "80%", lg: "50%" });

    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; preview: string; file: File }[]>([]);
    const [fileMessage, setFileMessage] = useState("");
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
    const isOwner = room?.owner_id === user?.ID;

    // Block the users
    const userActivityMap = new Map<string, { full_name: string; avatar: string; lastMessageTime: number }>();

    messages.forEach((msg) => {
        userActivityMap.set(msg.user_id, {
            full_name: msg.full_name,
            avatar: msg.avatar,
            lastMessageTime: new Date(msg.created_at).getTime(),
        });
    });

    const sortedUsers = Array.from(userActivityMap.entries())
        .sort((a, b) => b[1].lastMessageTime - a[1].lastMessageTime)
        .map(([id, data]) => ({
            id,
            ...data,
        }));

    const [selectedUser, setSelectedUser] = useState<null | {
        user_id: string;
        full_name: string;
        avatar: string;
    }>(null);

    const {
        isOpen: isProfileOpen,
        onOpen: onProfileOpen,
        onClose: onProfileClose
    } = useDisclosure();





    const now = Date.now();
    const onlineIds = sortedUsers
        .filter((user) => now - user.lastMessageTime < 5 * 60 * 1000) // 5 хвилин
        .map((user) => user.id);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"; // скидаємо висоту
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"; // встановлюємо нову
        }
    };




    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("JWT токен не знайдено!");
            return;
        }
        const wsUrl = getWsUrl("chat", { token, room_id: roomId });

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => console.log("✅ WebSocket відкрито");

        ws.current.onmessage = (event) => {
            try {
                const receivedData = JSON.parse(event.data);
                if (Array.isArray(receivedData)) {
                    setMessages(receivedData);
                } else if (receivedData?.type === "update_message") {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === receivedData.id
                                ? { ...msg, content_url: receivedData.content_url, isLoading: false }
                                : msg
                        )
                    );
                } else if (receivedData && receivedData.message !== undefined) {
                    setMessages((prev) => {
                        const exists = prev.find((m) => m.id === receivedData.id);
                        if (exists) {
                            return prev.map((msg) =>
                                msg.id === receivedData.id
                                    ? { ...msg, ...receivedData, isLoading: false }
                                    : msg
                            );
                        } else {
                            return [...prev, { ...receivedData, isLoading: false }];
                        }
                    });
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
                full_name: user?.fullName || "",
                avatar: user?.avatar || "",
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
        if (!e.target.files) return;
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

    const removeFile = (index: number) => {
        const updated = [...filePreviews];
        URL.revokeObjectURL(updated[index].preview);
        updated.splice(index, 1);
        setFilePreviews(updated);
        setFiles(updated.map(f => f.file));
    };

    const uploadSelectedFiles = async () => {
        if (!files.length || !user) return;

        const messageId = crypto.randomUUID();
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));

        const placeholderMessage: MessageType = {
            id: messageId,
            user_id: user.ID,
            full_name: user.fullName || "",
            avatar: user.avatar || "",
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
            console.error("Помилка при завантаженні файлів:", err);
        }
    };


    const inputBg = useColorModeValue("white", "gray.700");
    const inputColor = useColorModeValue("black", "white");
    const inputBorder = useColorModeValue("teal.300", "teal.600");

    return (
        <Flex direction="row" h="96vh" w="100%" maxW="1920px" p={6} mx="auto">
            {/* Ліва панель з користувачами */}
            <Box w="200px" pr={4} overflowY="auto" mt={16}>
                <Text fontSize="md" fontWeight="bold" mb={1}>Учасники</Text>
                <Text fontSize="sm" color="gray.500" mb={4}>
                    Онлайн: {onlineIds.length} / {sortedUsers.length}
                </Text>

                <VStack align="stretch" spacing={1}>
                    {sortedUsers.map((user) => (
                        <HStack
                            key={user.id}
                            spacing={3}
                            cursor="pointer"
                            _hover={{ bg: useColorModeValue("gray.100", "gray.700"), borderRadius: "md" }}
                            p={2}
                            onClick={() => {
                                setSelectedUser({
                                    user_id: user.id,
                                    full_name: user.full_name,
                                    avatar: user.avatar,
                                });
                                onProfileOpen()
                            }}
                        >
                            <Box position="relative">
                                <Image
                                    src={user.avatar}
                                    alt={user.full_name}
                                    boxSize="35px"
                                    borderRadius="full"
                                />
                                <Box
                                    position="absolute"
                                    bottom="0"
                                    right="0"
                                    boxSize="10px"
                                    bg={onlineIds.includes(user.id) ? "green.400" : "gray.400"}
                                    borderRadius="full"
                                    border="2px solid white"
                                />
                            </Box>
                            <Tooltip label={user.full_name} hasArrow placement="right">
                                <Text fontSize="sm" isTruncated>
                                    {user.full_name}
                                </Text>
                            </Tooltip>
                        </HStack>
                    ))}
                </VStack>
                <UserProfileModal isOpen={isProfileOpen} onClose={onProfileClose} user={selectedUser} />

            </Box>



            {/* Основна частина чату */}
            <Flex direction="column" flex="1">
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
                        <Button as="label"
                                htmlFor="file-upload"
                                variant="link"
                                _hover={{ transform: 'scale(1.1)' }}
                                _active={{ transform: 'scale(0.95)' }}
                                transition="all 0.1s ease-in-out"
                                cursor="pointer"
                        >
                            <AttachmentIcon color={"teal.400"} boxSize="40px"/>
                        </Button>
                        <input type="file" id="file-upload" hidden onChange={handleFileSelect} multiple />
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Send message..."
                            resize="none"
                            minH="45px"
                            maxH="200px"
                            isDisabled={isRoomClosed || (isChannel && !isOwner)}
                            bg={inputBg}
                            color={inputColor}
                            borderColor={inputBorder}
                            focusBorderColor={inputBorder}
                            overflow="hidden"
                            _placeholder={{ color: useColorModeValue("gray.500", "gray.400") }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                    if (textareaRef.current) {
                                        textareaRef.current.style.height = "auto";
                                    }

                                }
                            }}
                        />


                        <Button
                            onClick={sendMessage}
                            leftIcon={<Image src={sendMessageIcon} boxSize="40px" />}
                            variant="link"
                            isDisabled={isRoomClosed || (isChannel && !isOwner)}
                            _hover={{ transform: 'scale(1.1)' }}
                            _active={{ transform: 'scale(0.95)' }}
                            transition="all 0.1s ease-in-out"
                            cursor="pointer"
                        />

                    </HStack>
                )}

                <FilePreviewModal
                    isOpen={isFileModalOpen}
                    onClose={onFileModalClose}
                    files={filePreviews}
                    onRemove={removeFile}
                    onUpload={uploadSelectedFiles}
                    message={fileMessage}
                    onMessageChange={setFileMessage}
                />

            </Flex>
        </Flex>
    );
}

export default ChatRoom;