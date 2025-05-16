import { Flex, useBreakpointValue } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
    DirectService,
    MediaService,
    type UserPublic,
    CancelError,
    DirectMessage,
} from "../../client";
import { useDirectSocket } from "../../hooks/useDirectSocket";
import useAuth from "../../hooks/useAuth.ts";
import UserListSidebar from "../../components/Direct/UserListSidebar";
import DirectChatView from "../../components/Direct/DirectChatView";

export const Route = createFileRoute("/_layout/direct")({
    component: DirectPage,
});

function DirectPage() {
    const [users, setUsers] = useState<UserPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [input, setInput] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [filePreviews, setFilePreviews] = useState<any[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [fileMessage, setFileMessage] = useState("");
    const [chatId, setChatId] = useState<string | null>(null);
    const [isMobileChatView, setIsMobileChatView] = useState(false);

    const { user } = useAuth();
    const isMobile = useBreakpointValue({ base: true, md: false });


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
            socketRef.current.send(
                JSON.stringify({ type: "edit_message", ID: editingMessageId, message: input.trim() })
            );
            setEditingMessageId(null);
        } else {
            socketRef.current.send(
                JSON.stringify({ type: "new_message", message: input.trim() })
            );
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
    };

    const uploadSelectedFiles = async () => {
        if (!files.length || !user) return;
        const messageId = crypto.randomUUID();
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const placeholderMessage = {
            ID: messageId,
            SenderID: user.ID,
            ChatID: chatId || "",
            Message: fileMessage,
            CreatedAt: new Date().toISOString(),
            Reaction: "",
            content_url: [],
            isLoading: true,
        };

        setMessages((prev) => [...prev, placeholderMessage]);
        socketRef.current?.send(JSON.stringify({ placeholderMessage }));

        try {
            const res = await MediaService.downloadImages(messageId, formData);
            const fileUrls = res.map((f: { url: string }) => f.url);
            const updateMessage = {
                type: "update_message",
                id: messageId,
                content_url: fileUrls,
            };
            socketRef.current?.send(JSON.stringify(updateMessage));
            setFiles([]);
            setFilePreviews([]);
            setFileMessage("");
        } catch (e) {
            console.error("Upload error", e);
        }
    };

    return (
        <Flex h="100vh" w="full">
            {(!isMobile || !isMobileChatView) && (
                <UserListSidebar
                    users={users}
                    loading={loading}
                    onSelect={(user) => {
                        setSelectedUser(user);
                        if (isMobile) setIsMobileChatView(true);
                    }}
                />
            )}

            {user && selectedUser && (!isMobile || isMobileChatView) && (
                <DirectChatView
                    user={user}
                    selectedUser={selectedUser}
                    messages={messages}
                    input={input}
                    onChangeInput={setInput}
                    onSend={handleSend}
                    onEdit={(id, msg) => {
                        setEditingMessageId(id);
                        setInput(msg);
                    }}
                    onDelete={(id) => {
                        socketRef.current?.send(JSON.stringify({ type: "delete_message", ID: id }));
                        setMessages((prev) => prev.filter((m) => m.ID !== id));
                    }}
                    onReact={(id, emoji) =>
                        socketRef.current?.send(
                            JSON.stringify({ type: "add_reaction", message_id: id, reaction: emoji })
                        )
                    }
                    onImageClick={(url) => console.log("Image click:", url)}
                    editingMessageId={editingMessageId}
                    onCancelEdit={() => {
                        setEditingMessageId(null);
                        setInput("");
                    }}
                    onFileSelect={handleFileSelect}
                    filePreviews={filePreviews}
                    files={files}
                    fileMessage={fileMessage}
                    onUpload={uploadSelectedFiles}
                    onMessageChange={setFileMessage}
                    onRemoveFile={(i) => {
                        const updated = [...filePreviews];
                        URL.revokeObjectURL(updated[i].preview);
                        updated.splice(i, 1);
                        setFilePreviews(updated);
                        setFiles(updated.map((f) => f.file));
                    }}
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
                    isMobile={isMobile}
                    onBack={() => setIsMobileChatView(false)}
                />
            )}
        </Flex>
    );
}

export default DirectPage;
