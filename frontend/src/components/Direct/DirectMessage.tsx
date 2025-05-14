import {
    Box,
    Fade,
    Flex,
    IconButton,
    Image,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal,
    SimpleGrid,
    Spinner,
    Text,
    useColorModeValue,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { TiHeartOutline } from "react-icons/ti";
import {
    FcDocument,
    FcFile,
    FcOpenedFolder,
} from "react-icons/fc";
import AudioPlayer from "../Chat/AudioPlayer";
import LinkPreview from "../Modals/LinkPreviewModal";
import React from "react"


interface DirectMessageProps {
    msg: {
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
    }
    user?: { ID: string } | null;
    isMe: boolean;
    isLast?: boolean;
    onDelete?: (id: string) => void;
    onEdit?: () => void;
    onReact?: (id: string, emoji: string) => void;
    onImageClick?: (url: string) => void;
}

function parseMessageWithLinks(text?: string | null) {
    const safeText = typeof text === "string" ? text : "";
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
    const parts = safeText.split(urlRegex);

    return parts.map((part, index) => {
        if (urlRegex.test(part)) {
            const url = part.startsWith("http") ? part : `https://${part}`;
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

const DirectMessageBubble: React.FC<DirectMessageProps> = ({
                                                               msg,
                                                               isMe,
                                                               isLast,
                                                               onDelete,
                                                               onEdit,
                                                               onReact,
                                                               onImageClick,
                                                           }) => {
    const bgColor = useColorModeValue(isMe ? "teal.500" : "cyan.100", isMe ? "teal.400" : "cyan.600");
    const textColor = useColorModeValue(isMe ? "white" : "black", "white");
    const hasFiles = Array.isArray(msg.ContentUrl) && msg.ContentUrl.length > 0;

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const { isOpen: isPopoverOpen, onOpen: onPopoverOpen, onClose: onPopoverClose } = useDisclosure();

    useEffect(() => {
        if (isLast && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [isLast]);

    const extractFirstLink = (text: string | null | undefined) => {
        const match = (text ?? "").match(/(https?:\/\/[^\s]+)/);
        return match ? match[0] : null;
    };

    const url = extractFirstLink(msg.Message);

    return (
        <Flex
            justify={isMe ? "flex-end" : "flex-start"}
            align="flex-end"
            w="100%"
            px={2}
            mb={1}
            ref={scrollRef}
        >
            <Box
                bg={bgColor}
                color={textColor}
                p={3}
                borderRadius="lg"
                borderTopRightRadius={isMe ? 0 : "lg"}
                borderTopLeftRadius={isMe ? "lg" : 0}
                maxW="80%"
                wordBreak="break-word"
                whiteSpace="pre-wrap"
                position="relative"
                transition="all 0.2s ease-in-out"
                boxShadow="sm"
            >

            {isMe && (
                    <Menu placement="bottom-end">
                        <MenuButton
                            as={IconButton}
                            icon={<FiEdit />}
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            top="-2px"
                            right="-5px"
                            _hover={{ bg: "transparent" }}
                            aria-label="Message Options"
                        />
                        <Portal>
                            <MenuList zIndex={3}>
                                <MenuItem icon={<FiEdit />} onClick={onEdit}>
                                    Edit Message
                                </MenuItem>
                                <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => onDelete?.(msg.ID)}>
                                    Delete
                                </MenuItem>
                            </MenuList>
                        </Portal>
                    </Menu>
                )}

                {msg.isLoading ? (
                    <Spinner size="sm" color={isMe ? "white" : "gray.600"} mt={2} />
                ) : (
                    <Fade in>
                        <>
                            {hasFiles && (() => {
                                const imageUrls = msg.ContentUrl!.filter((url) =>
                                    url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                );
                                const otherFiles = msg.ContentUrl!.filter((url) =>
                                    !url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                );

                                return (
                                    <>
                                        {imageUrls.length > 0 && (
                                            <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
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
                                            <SimpleGrid columns={1} spacing={2} mt={2}>
                                                {otherFiles.map((url, index) => {
                                                    const fileName = url.split("/").pop()?.split("?")[0] || `File ${index + 1}`;
                                                    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

                                                    const isAudio = ["mp3", "wav", "ogg"].includes(fileExt);
                                                    const isVideo = ["mp4", "webm", "mov", "avi"].includes(fileExt);

                                                    if (isAudio) {
                                                        return (
                                                            <Box key={index} bg="whiteAlpha.200" p={2} borderRadius="md">
                                                                <Text mb={1} fontSize="sm" color="teal.200">{fileName}</Text>
                                                                <AudioPlayer src={url} />
                                                            </Box>
                                                        );
                                                    }

                                                    if (isVideo) {
                                                        return (
                                                            <Box key={index} bg="whiteAlpha.200" p={2} borderRadius="md">
                                                                <Text mb={1} fontSize="sm" color="teal.200">{fileName}</Text>
                                                                <video controls src={url} style={{ width: "100%", borderRadius: "8px" }} />
                                                            </Box>
                                                        );
                                                    }

                                                    const FileIcon = ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx"].includes(fileExt)
                                                        ? FcDocument
                                                        : ["zip", "rar", "7z", "tar", "gz"].includes(fileExt)
                                                            ? FcOpenedFolder
                                                            : FcFile;

                                                    return (
                                                        <Flex key={index} align="center" bg="whiteAlpha.200" borderRadius="md" p={2} gap={3}>
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

                            {msg.Message && (
                                <>
                                    <Text mt={3}>{parseMessageWithLinks(msg.Message)}</Text>
                                    {url && <Box mt={3}><LinkPreview url={url} /></Box>}
                                </>
                            )}
                        </>
                    </Fade>
                )}

                {msg.Reaction && (
                    <Box
                        mt={2}
                        px={2}
                        py={1}
                        bg="whiteAlpha.300"
                        color="black"
                        borderRadius="md"
                        fontSize="sm"
                        display="inline-block"
                    >
                        {msg.Reaction}
                    </Box>
                )}


                <Flex align="center" gap={2} mt={2} justify="space-between">
                    <Text fontSize="sm" color={isMe ? "white" : "gray.600"}>
                        {new Date(msg.CreatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })}
                    </Text>
                    {msg.EditedAt && (
                        <Text fontSize="xs" color={isMe ? "whiteAlpha.700" : "gray.400"} fontStyle="italic">
                            (edited)
                        </Text>
                    )}
                    <Popover isOpen={isPopoverOpen} onOpen={onPopoverOpen} onClose={onPopoverClose}>
                        <PopoverTrigger>
                            <IconButton
                                icon={<TiHeartOutline />}
                                size="40px"
                                variant="ghost"
                                aria-label="react"
                                _hover={{ bg: bgColor, transform: "scale(1.15)" }}
                                _active={{ transform: "scale(0.95)" }}
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
                                                onReact?.(msg.ID, emoji);
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
        </Flex>
    );
};

export default React.memo(DirectMessageBubble);
