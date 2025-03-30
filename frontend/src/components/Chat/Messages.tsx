import {
    Avatar,
    Box,
    Flex,
    Text,
    useColorModeValue,
    Image,
    Link,
    SimpleGrid,
    Spinner,
    Fade,
    Tooltip
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import UserProfileModal from "../Modals/UserProfileModal";
import LinkPreview from "../Modals/LinkPreviewModal";
import { useState, useEffect, useRef } from "react";

interface MessageProps {
    msg: {
        id: string;
        user_id: string;
        avatar: string;
        full_name: string;
        message?: string;
        content_url?: string[];
        created_at: string;
        isLoading?: boolean;
    };
    isMe: boolean;
    isLast?: boolean;
}

function parseMessageWithLinks(text: string) {
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
    const parts = text.split(urlRegex);

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

const MessageBubble: React.FC<MessageProps> = ({ msg, isMe, isLast }) => {
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

    const extractFirstLink = (text: string) => {
        const match = text.match(/(https?:\/\/[^\s]+)/);
        return match ? match[0] : null;
    };
    const url = extractFirstLink(msg.message || "");

    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isLast && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [isLast]);

    return (
        <Flex justify={isMe ? "flex-end" : "flex-start"}>
            {!isMe && (
                <Tooltip label={msg.full_name} hasArrow placement="top">
                    <Avatar
                        src={msg.avatar || "https://via.placeholder.com/50"}
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
                maxH="auto"
                overflowY="auto"
                wordBreak="break-word"
                whiteSpace="pre-wrap"
            >
                <Text fontSize="sm" fontWeight="bold">
                    {isMe ? "" : msg.full_name}
                </Text>

                {msg.isLoading ? (
                    <Spinner size="sm" color={isMe ? "white" : "gray.600"} mt={2} />
                ) : (
                    <>
                        <Fade in={!msg.isLoading}>
                            {hasFiles && (
                                <SimpleGrid
                                    columns={msg.content_url!.length === 1 ? 1 : 2}
                                    spacing={2}
                                    mt={2}
                                    w="100%"
                                >
                                    {msg.content_url!.map((url, index) => {
                                        if (!url || typeof url !== "string") return null;

                                        return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <Image
                                                key={index}
                                                src={url}
                                                alt={`file-${index}`}
                                                borderRadius="md"
                                                maxW="100%"
                                                maxH="200px"
                                                objectFit="cover"
                                            />
                                        ) : (
                                            <Link
                                                key={index}
                                                href={url}
                                                isExternal
                                                color="teal.200"
                                                textDecoration="underline"
                                                _hover={{
                                                    color: "teal.300",
                                                    textDecoration: "none",
                                                    transform: "scale(1.02)"
                                                }}
                                                transition="all 0.2s ease-in-out"
                                            >
                                                📎 Файл {index + 1}
                                            </Link>
                                        );
                                    })}
                                </SimpleGrid>
                            )}
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


                <Text fontSize="sm" color={isMe ? "white" : "gray.600"} mt={2}>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    })}
                </Text>
            </Box>
            <UserProfileModal isOpen={isOpen} onClose={onClose} user={selectedUser} />
        </Flex>
    );
};

export default MessageBubble;
