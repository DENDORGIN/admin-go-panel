import {
    Box, Flex, Text, VStack,
} from "@chakra-ui/react";
import { type DirectMessage, type UserPublic } from "../../client";
import DirectMessageBubble from "./DirectMessage";
import DirectInputBar from "./DirectInputBar";
import FilePreviewModal from "../Modals/FilePreviewModal";

type Props = {
    user: UserPublic;
    selectedUser: UserPublic;
    messages: DirectMessage[];
    input: string;
    onChangeInput: (val: string) => void;
    onSend: () => void;
    onEdit: (id: string, text: string) => void;
    onDelete: (id: string) => void;
    onReact: (id: string, emoji: string) => void;
    onImageClick: (url: string) => void;
    editingMessageId: string | null;
    onCancelEdit: () => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    filePreviews: any[];
    files: File[];
    fileMessage: string;
    onUpload: () => void;
    onMessageChange: (val: string) => void;
    onRemoveFile: (i: number) => void;
    onAddFiles: (newFiles: File[]) => void;
    isMobile?: boolean;
    onBack?: () => void;
};

export default function DirectChatView({
                                           user,
                                           selectedUser,
                                           messages,
                                           input,
                                           onChangeInput,
                                           onSend,
                                           onEdit,
                                           onDelete,
                                           onReact,
                                           onImageClick,
                                           editingMessageId,
                                           onCancelEdit,
                                           onFileSelect,
                                           filePreviews,
                                           // files,
                                           fileMessage,
                                           onUpload,
                                           onMessageChange,
                                           onRemoveFile,
                                           onAddFiles,
                                           isMobile,
                                           onBack,
                                       }: Props) {
    return (
        <Flex direction="column" flex="1" h="full" px={4} py={6}>
            <Box flexShrink={0} pt={8} px={4}>
                {isMobile && (
                    <Text fontSize="sm" color="blue.500" mb={2} cursor="pointer" onClick={onBack}>
                        ← Назад
                    </Text>
                )}
                <Text fontSize="xl" fontWeight="bold">Чат з {selectedUser.fullName ?? selectedUser.email}</Text>
            </Box>

            <VStack spacing={3}
                    align="stretch"
                    px={4}
                    flex="1"
                    overflowY="auto">
                {messages.map((msg, idx) => (
                    <DirectMessageBubble
                        key={msg.ID}
                        msg={msg}
                        isMe={msg.SenderID === user.ID}
                        isLast={idx === messages.length - 1}
                        onEdit={() => onEdit(msg.ID, msg.Message)}
                        onDelete={onDelete}
                        onReact={onReact}
                        onImageClick={onImageClick}
                    />
                ))}
            </VStack>

            <Box px={4} pt={2} pb={4} borderColor="gray.200">
                <DirectInputBar
                    value={input}
                    onChange={onChangeInput}
                    onSend={onSend}
                    onFileSelect={onFileSelect}
                    disabled={!selectedUser || !user}
                />
                {editingMessageId && (
                    <Text color="teal.500" fontSize="sm" mt={1} px={2}>
                        ✏️ Ви редагуєте повідомлення
                        <span style={{ cursor: "pointer", marginLeft: 10, color: "red" }} onClick={onCancelEdit}>
              Скасувати
            </span>
                    </Text>
                )}
                <FilePreviewModal
                    isOpen={!!filePreviews.length}
                    onClose={() => {}}
                    files={filePreviews}
                    onRemove={onRemoveFile}
                    onUpload={onUpload}
                    message={fileMessage}
                    onMessageChange={onMessageChange}
                    onAddFiles={onAddFiles}
                />
            </Box>
        </Flex>
    );
}
