// direct.tsx
import {
    Avatar, Badge, Box, Flex, Spinner, Text, VStack, useDisclosure
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DirectService, MediaService, type UserPublic, CancelError } from "../../client";
import { useDirectSocket } from "../../hooks/useDirectSocket";
import useAuth from "../../hooks/useAuth.ts";
import DirectMessageBubble from "../../components/Direct/DirectMessage";
import DirectInputBar from "../../components/Direct/DirectInputBar";
import FilePreviewModal from "../../components/Modals/FilePreviewModal";

export const Route = createFileRoute("/_layout/direct")({
    component: DirectPage,
});

function DirectPage() {
    const [users, setUsers] = useState<UserPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const [filePreviews, setFilePreviews] = useState<any[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [fileMessage, setFileMessage] = useState("");


    // @ts-ignore
    const [chatId, setChatId] = useState<string | null>(null);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user } = useAuth();

    const socketRef = useDirectSocket({
        user,
        selectedUser,
        setMessages,
        setEditingMessageId,
        setInput,
        onNewMessage: (msg) => {
            setMessages((prev) => [...prev, msg]);
            setInput("");
        },
        setChatId,
    });


    useEffect(() => {
        const cancelable = DirectService.readUsers();

        cancelable
            .then(setUsers)
            .catch((err) => {
                // ❗ Перевіряємо не лише err.name, а й instanceof для безпеки
                if (!(err instanceof CancelError) && err?.name !== "CancelError") {
                    console.error("❌ readUsers error", err);
                }
            })
            .finally(() => setLoading(false));

        return () => cancelable.cancel?.();
    }, []);



    const handleSend = () => {
        if (!input.trim() || !socketRef.current) return;

        if (editingMessageId) {
            socketRef.current.send(JSON.stringify({ type: "edit_message", ID: editingMessageId, message: input.trim() }));
            setEditingMessageId(null);
        } else {
            socketRef.current.send(JSON.stringify({ type: "new_message", message: input.trim() }));
        }

        setInput("");
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !user) return;
        const selectedFiles = Array.from(e.target.files);
        const previews = selectedFiles.map((file) => ({
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            preview: URL.createObjectURL(file),
            file,
        }));
        setFilePreviews(previews);
        setFiles(selectedFiles);
        onOpen();
    };

    const uploadSelectedFiles = async () => {
        if (!files.length || !user) return;

        const messageId = crypto.randomUUID();
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));

        const placeholderMessage = {
            ID: messageId,
            SenderID: user.ID,
            ChatID: "temp",
            Message: input,
            CreatedAt: new Date().toISOString(),
            Reaction: "",
            ContentUrl: [],
            isLoading: true,
        };

        setMessages(prev => [...prev, placeholderMessage]);
        socketRef.current?.send(JSON.stringify({ placeholderMessage }));
        onClose();

        try {
            const res = await MediaService.downloadImages(messageId, formData);
            const urls = res.map((f: { url: string }) => f.url);
            socketRef.current?.send(JSON.stringify({ type: "update_message", id: messageId, content_url: urls }));
            setFiles([]);
            setFilePreviews([]);
            setFileMessage("");
        } catch (e) {
            console.error("Upload error", e);
        }
    };

    return (
        <Flex h="100vh" w="full">
            <Box w="320px" bg="gray.100" borderRight="1px" borderColor="gray.300" px={4} py={6} overflowY="auto">
                <Text fontSize="lg" fontWeight="semibold" mb={4} pt={8}>Користувачі</Text>
                {loading ? <Flex justify="center" mt={4}><Spinner size="sm" /></Flex> : (
                    <VStack align="stretch" spacing={2}>
                        {users.map((u) => (
                            <Flex key={u.ID} align="center" gap={3} p={2} borderRadius="md" _hover={{ bg: "gray.200" }} cursor="pointer" onClick={() => setSelectedUser(u)}>
                                <Avatar size="sm" name={u.fullName ?? u.email} src={u.avatar ?? undefined} />
                                <Box>
                                    <Flex align="center" gap={2}>
                                        <Text fontWeight="medium">{u.fullName ?? u.email}</Text>
                                        <Badge colorScheme={u.isSuperUser ? "green" : u.isAdmin ? "blue" : u.isActive ? "yellow" : "red"}>
                                            {u.isSuperUser ? "SuperUser" : u.isAdmin ? "Admin" : u.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </Flex>
                                    <Text fontSize="sm" color="gray.500">{u.email}</Text>
                                </Box>
                            </Flex>
                        ))}
                    </VStack>
                )}
            </Box>

            <Flex direction="column" flex="1" h="full" px={4} py={6}>
                {selectedUser ? (
                    <>
                        <Box flexShrink={0} pt={8} px={4}>
                            <Text fontSize="xl" fontWeight="bold">Чат з {selectedUser.fullName ?? selectedUser.email}</Text>
                        </Box>

                        <VStack spacing={3} align="stretch" px={4} flex="1" overflowY="auto">
                            {messages.map((msg, idx) => (
                                <DirectMessageBubble
                                    key={msg.ID}
                                    msg={msg}
                                    isMe={msg.SenderID === user?.ID}
                                    isLast={idx === messages.length - 1}
                                    onEdit={() => { setEditingMessageId(msg.ID); setInput(msg.Message); }}
                                    onDelete={(ID) => {
                                        socketRef.current?.send(JSON.stringify({ type: "delete_message", ID }));
                                        setMessages(prev => prev.filter(m => m.ID !== ID));
                                    }}
                                    onReact={(id, emoji) => {
                                        socketRef.current?.send(JSON.stringify({ type: "add_reaction", message_id: id, reaction: emoji }));
                                    }}
                                    onImageClick={(url) => console.log("Image click:", url)}
                                />
                            ))}
                        </VStack>

                        <Box px={4} pt={2} pb={4} borderTop="1px solid" borderColor="gray.200">
                            <DirectInputBar
                                ref={inputRef}
                                value={input}
                                onChange={setInput}
                                onSend={handleSend}
                                onFileSelect={handleFileSelect}
                                disabled={!selectedUser || !user}
                            />
                            {editingMessageId && (
                                <Text color="teal.500" fontSize="sm" mt={1} px={2}>
                                    ✏️ Ви редагуєте повідомлення
                                    <span
                                        style={{ cursor: "pointer", marginLeft: 10, color: "red" }}
                                        onClick={() => { setEditingMessageId(null); setInput(""); }}
                                    >
                                    Скасувати
                                  </span>
                                </Text>
                            )}
                            <FilePreviewModal
                                isOpen={isOpen}
                                onClose={onClose}
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
                        </Box>
                    </>
                ) : (
                    <Flex align="center" justify="center" flex="1">
                        <Text color="gray.500" fontSize="lg">Виберіть співрозмовника, щоб почати чат</Text>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
}

export default DirectPage;
