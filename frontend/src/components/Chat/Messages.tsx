import {
    Avatar,
    Box,
    Flex,
    Text,
    useColorModeValue,
    Link,
    Image,
    SimpleGrid,
    Spinner,
    Fade,
    Tooltip,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Portal,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import { Popover, PopoverTrigger, PopoverContent, PopoverBody } from "@chakra-ui/react";
import { DragHandleIcon } from '@chakra-ui/icons'

import UserProfileModal from "../Modals/UserProfileModal";
import LinkPreview from "../Modals/LinkPreviewModal";
import AudioPlayer from "../Chat/AudioPlayer";


import React from "react";
import { useState, useEffect, useRef } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { TiHeartOutline } from "react-icons/ti";
import {
    FcDocument,
    FcFile,
    FcOpenedFolder,
} from "react-icons/fc";



type Reaction = {
    user_id: string;
    emoji: string;
};

interface MessageProps {
    msg: {
        id: string;
        user_id: string;
        avatar: string;
        full_name: string;
        message?: string;
        content_url?: string[];
        created_at: string;
        edited_at?: string;
        isLoading?: boolean;
        reactions?: Reaction[];

    };
    user?: { ID: string } | null
    isMe: boolean;
    isLast?: boolean;
    onDelete?: (id: string) => void;
    onEdit?: () => void;
    onReact?: (id: string, emoji: string) => void;
    onImageClick?: (url: string) => void;

}

function parseMessageWithLinks(text: string | undefined | null) {
    const safeText = typeof text === "string" ? text : "";
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
    const parts = safeText.split(urlRegex);

    return parts.map((part, index) => {
        if (urlRegex.test(part)) {
            const url = part.startsWith('http') ? part : `https://${part}`;
            return (
                <Link
                    key={index}
                    href={url}
                    isExternal
                    color="teal.200"
                    textDecoration="underline"
                    _hover={{ color: "teal.300", textDecoration: "none", transform: "scale(1.02)" }}
                    transition="all 0.2s ease-in-out"
                >
                    {part}
                </Link>
            );
        } else {
            return <span key={index}>{part}</span>;
        }
    });
}


const MessageBubble: React.FC<MessageProps> = React.memo(({ msg, isMe, user, isLast, onDelete, onEdit, onReact, onImageClick }) => {
    const bgColor = useColorModeValue(
        isMe ? "teal.500" : "cyan.100",
        isMe ? "teal.400" : "cyan.600"
    );
    const textColor = useColorModeValue(isMe ? "white" : "black", "white");

    const hasFiles = Array.isArray(msg.content_url) && msg.content_url.length > 0;

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState<null | {
        user_id: string;
        full_name: string;
        avatar: string;
    }>(null);

    const extractFirstLink = (text: string | null | undefined) => {
        const safeText = typeof text === "string" ? text : "";
        const match = safeText.match(/(https?:\/\/[^\s]+)/);
        return match ? match[0] : null;
    };

    const url = extractFirstLink(msg.message || "");

    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isLast && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [isLast]);

    const {
        isOpen: isPopoverOpen,
        onOpen: onPopoverOpen,
        onClose: onPopoverClose
    } = useDisclosure();
    console.log("🔁 render", msg.id);


    return (
        <Flex justify={isMe ? "flex-end" : "flex-start"}>
            {!isMe && (
                <Tooltip label={msg.full_name} hasArrow placement="top">
                    <Avatar
                        src={msg.avatar || "https://images.unsplash.com/flagged/photo-1572491259205-506c425b45c3"}
                        cursor="pointer"
                        transition="all 0.2s ease-in-out"
                        _hover={{ transform: "scale(1.1)", boxShadow: "md" }}
                        onClick={() => {
                            setSelectedUser({
                                user_id: msg.user_id,
                                full_name: msg.full_name,
                                avatar: msg.avatar,
                            });
                            onOpen();
                        }}
                    />
                </Tooltip>
            )}

            <Box
                ref={scrollRef}
                bg={bgColor}
                color={textColor}
                p={3}
                borderRadius="lg"
                maxW="80%"
                position="relative"
                maxH="auto"
                overflowY="visible"
                wordBreak="break-word"
                whiteSpace="pre-wrap"
                zIndex={1}
            >
                {isMe && (
                    <Menu placement="bottom-end">
                        <MenuButton
                            as={IconButton}
                            icon={<DragHandleIcon />}
                            variant="ghost"
                            size="sm"
                            aria-label="Options"
                            position="absolute"
                            top="-2px"
                            right="-5px"
                            _hover={{ bg: "transparent" }}
                            zIndex={2}
                        />
                        <Portal>
                            <MenuList zIndex={3}>
                                <MenuItem icon={<FiEdit />} onClick={onEdit}>
                                    Edit Message
                                </MenuItem>
                                <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => onDelete?.(msg.id)}>
                                    Delete
                                </MenuItem>
                            </MenuList>
                        </Portal>
                    </Menu>
                )}

                <Text fontSize="sm" fontWeight="bold">
                    {isMe ? "" : msg.full_name}
                </Text>

                {msg.isLoading ? (
                    <Spinner size="sm" color={isMe ? "white" : "gray.600"} mt={2} />
                ) : (
                    <>
                        <Fade in={!msg.isLoading}>
                            {hasFiles && (() => {
                                const imageUrls = msg.content_url!.filter((url) =>
                                    url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                );
                                const otherFiles = msg.content_url!.filter((url) =>
                                    !url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                );

                                return (
                                    <>
                                        {imageUrls.length > 0 && (
                                            <Box display="flex" flexWrap="wrap" gap={2} mt={2} p={1}>
                                                {imageUrls.map((src, index) => (
                                                    <Image
                                                        key={index}
                                                        src={src}
                                                        alt={`image-${index}`}
                                                        maxW="150px"
                                                        maxH="150px"
                                                        borderRadius="md"
                                                        cursor="pointer"
                                                        onClick={() => onImageClick?.(src)}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                        {otherFiles.length > 0 && (
                                            <SimpleGrid columns={1} spacing={2} mt={2} w="100%">
                                                {otherFiles.map((url, index) => {
                                                    const fileName = url.split('/').pop()?.split('?')[0] || `File ${index + 1}`;
                                                    const fileExt = fileName.split('.').pop()?.toLowerCase();

                                                    const isAudio = ["mp3", "wav", "ogg"].includes(fileExt!);
                                                    const isVideo = ["mp4", "webm", "mov", "avi"].includes(fileExt!);

                                                    // 🎧 Аудіо
                                                    if (isAudio) {
                                                        return (
                                                            <Box key={index} w="100%" bg="whiteAlpha.200" p={2} borderRadius="md">
                                                                <Text mb={1} fontSize="sm" color="teal.200">{fileName}</Text>
                                                                <AudioPlayer src={url} />
                                                            </Box>
                                                        );
                                                    }

                                                    // 🎞️ Відео
                                                    if (isVideo) {
                                                        return (
                                                            <Box key={index} w="100%" bg="whiteAlpha.200" p={2} borderRadius="md">
                                                                <Text mb={1} fontSize="sm" color="teal.200">{fileName}</Text>
                                                                <video controls src={url} style={{ width: "100%", borderRadius: "8px" }} />
                                                            </Box>
                                                        );
                                                    }

                                                    // 📄 Іконка для документів/архівів
                                                    const FileIcon = (() => {
                                                        if (["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx"].includes(fileExt!)) return FcDocument;
                                                        if (["zip", "rar", "7z", "tar", "gz"].includes(fileExt!)) return FcOpenedFolder;
                                                        return FcFile;
                                                    })();

                                                    return (
                                                        <Flex
                                                            key={index}
                                                            align="center"
                                                            bg="whiteAlpha.200"
                                                            borderRadius="md"
                                                            p={2}
                                                            gap={3}
                                                        >
                                                            <Box fontSize="xl">
                                                                <FileIcon />
                                                            </Box>
                                                            <Link
                                                                href={url}
                                                                isExternal
                                                                color="teal.200"
                                                                fontWeight="medium"
                                                                _hover={{ textDecoration: "underline", color: "teal.300" }}
                                                                title={fileName}
                                                                wordBreak="break-word"
                                                            >
                                                                {fileName.length > 40 ? fileName.slice(0, 40) + "..." : fileName}
                                                            </Link>
                                                        </Flex>
                                                    );
                                                })}
                                            </SimpleGrid>
                                        )}


                                    </>
                                );
                            })()}
                        </Fade>

                        {msg.message && (
                            <>
                                <Text mt={3}>{parseMessageWithLinks(msg.message)}</Text>
                                {url && (
                                    <Box mt={3}>
                                        <LinkPreview url={url} />
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}

                {msg.reactions && msg.reactions.length > 0 && (() => {
                    // 🔁 Групуємо реакції
                    const grouped = msg.reactions.reduce((acc, r) => {
                        if (!acc[r.emoji]) acc[r.emoji] = [];
                        acc[r.emoji].push(r.user_id);
                        return acc;
                    }, {} as Record<string, string[]>);

                    return (
                        <Flex wrap="wrap" gap={2} mt={2}>
                            {Object.entries(grouped).map(([emoji, userIds]) => (
                                <Box
                                    key={emoji}
                                    px={2}
                                    py={1}
                                    bg={user?.ID && userIds.includes(user.ID) ? "pink.500" : "whiteAlpha.300"}
                                    color={user?.ID && userIds.includes(user.ID) ? "white" : "black"}
                                    borderRadius="md"
                                    fontSize="sm"
                                    cursor="default"

                                >
                                    {emoji} {userIds.length}
                                </Box>
                            ))}
                        </Flex>
                    );
                })()}

                <Flex align="center" gap={2} mt={2} justify="space-between">
                    <Flex align="center" gap={2}>
                        <Text fontSize="sm" color={isMe ? "white" : "gray.600"}>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                            })}
                        </Text>

                        {msg.edited_at && (
                            <Text fontSize="xs" color={isMe ? "whiteAlpha.700" : "gray.400"} fontStyle="italic">
                                (edited)
                            </Text>
                        )}
                    </Flex>

                    <Popover isOpen={isPopoverOpen} onOpen={onPopoverOpen} onClose={onPopoverClose}>
                        <PopoverTrigger>
                            <IconButton
                                icon={<TiHeartOutline />}
                                size="40px"
                                variant="ghost"
                                aria-label="react"
                                _hover={{ bg: bgColor, transform: "scale(1.15)" }}
                                _active={{ transform: "scale(0.95)" }}
                                transition="all 0.1s ease-in-out"
                                cursor="pointer"
                            />
                        </PopoverTrigger>
                        <Portal>
                            <PopoverContent w="fit-content" bg="gray.700" color="white" border="none" zIndex={9999}>
                                <PopoverBody display="flex" flexWrap="wrap" gap={2} p={2}>
                                    {["🔥", "❤️", "😂", "👍", "👎", "🎉", "💡", "😢", "😮"].map((emoji) => (
                                        <Text
                                            key={emoji}
                                            fontSize="xl"
                                            cursor="pointer"
                                            _hover={{ transform: "scale(1.3)" }}
                                            transition="all 0.2s ease"
                                            onClick={() => {
                                                onReact?.(msg.id, emoji);
                                                onPopoverClose();
                                            }}
                                        >
                                            {emoji}
                                        </Text>
                                    ))}
                                </PopoverBody>
                            </PopoverContent>
                        </Portal>
                    </Popover>
                </Flex>

            </Box>
            <UserProfileModal isOpen={isOpen} onClose={onClose} user={selectedUser} />
        </Flex>
    );
},
    (prevProps, nextProps) => {
        return (
            prevProps.msg.id === nextProps.msg.id &&
            JSON.stringify(prevProps.msg) === JSON.stringify(nextProps.msg) &&
            prevProps.isMe === nextProps.isMe &&
            prevProps.isLast === nextProps.isLast
        );
    }
);

export default MessageBubble;
