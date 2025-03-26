import {
    Avatar,
    Box,
    Flex,
    Text,
    useColorModeValue } from "@chakra-ui/react";

interface MessageProps {
    msg: {
        id: string;
        user_id: string;
        avatar: string;
        full_name: string;
        message: string;
        created_at: string;
    };
    isMe: boolean;

}

const MessageBubble: React.FC<MessageProps> = ({ msg, isMe }) => {
    const bgColor = useColorModeValue(isMe ? "blue.500" : "gray.200", isMe ? "blue.400" : "gray.600");
    const textColor = useColorModeValue(isMe ? "white" : "black", "white");

    return (
        <Flex justify={isMe ? "flex-end" : "flex-start"}>
            {!isMe && (
                <Avatar src={msg.avatar || "https://via.placeholder.com/50"} />
            )}
            <Box bg={bgColor} color={textColor} p={3} borderRadius="lg" maxW="70%">

                <Text fontSize="sm" fontWeight="bold">
                    {isMe ? "You" : msg.full_name}
                </Text>
                <Text>{msg.message}</Text>

                <Text fontSize="xs" color={isMe ? "white" : "gray.500"} mt={1}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                </Text>
            </Box>

        </Flex>

    );
};

export default MessageBubble;
