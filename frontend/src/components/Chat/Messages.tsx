import {
    Avatar,
    Box,
    Flex,
    Text,
    useColorModeValue,
    Image,
    Link,
    VStack,
    Spinner,
    Fade
} from "@chakra-ui/react";

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
}

const MessageBubble: React.FC<MessageProps> = ({ msg, isMe }) => {
    const bgColor = useColorModeValue(
        isMe ? "blue.500" : "gray.200",
        isMe ? "blue.400" : "gray.600"
    );
    const textColor = useColorModeValue(isMe ? "white" : "black", "white");

    const hasFiles = Array.isArray(msg.content_url) && msg.content_url.length > 0;

    return (
        <Flex justify={isMe ? "flex-end" : "flex-start"}>
            {!isMe && <Avatar src={msg.avatar || "https://via.placeholder.com/50"} />}
            <Box bg={bgColor} color={textColor} p={3} borderRadius="lg" maxW="70%">
                <Text fontSize="sm" fontWeight="bold">
                    {isMe ? "You" : msg.full_name}
                </Text>

                {msg.isLoading ? (
                    <Spinner size="sm" color={isMe ? "white" : "gray.600"} mt={2} />
                ) : (
                    <>
                        {msg.message && <Text mt={1}>{msg.message}</Text>}

                        <Fade in={!msg.isLoading}>
                            {hasFiles && (
                                <VStack spacing={2} mt={2} align="start">
                                    {msg.content_url!.map((url, index) => {
                                        if (!url || typeof url !== "string") return null;

                                        return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <Image
                                                key={index}
                                                src={url}
                                                alt={`file-${index}`}
                                                borderRadius="md"
                                                maxW="100%"
                                            />
                                        ) : (
                                            <Link
                                                key={index}
                                                href={url}
                                                isExternal
                                                color="teal.200"
                                                textDecoration="underline"
                                            >
                                                📎 Файл {index + 1}
                                            </Link>
                                        );
                                    })}
                                </VStack>
                            )}
                        </Fade>
                    </>
                )}

                <Text fontSize="xs" color={isMe ? "white" : "gray.500"} mt={2}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                </Text>
            </Box>
        </Flex>
    );
};

export default MessageBubble;
