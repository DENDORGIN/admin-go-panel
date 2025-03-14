import { Box, Container, Text, Input, Button, VStack, HStack, Divider } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import useAuth from "../../hooks/useAuth";

export const Route = createFileRoute("/_layout/chat")({
    component: ChatDashboard,
});

function ChatDashboard() {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const ws = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        const token = localStorage.getItem("access_token"); // Отримуємо JWT
        ws.current = new WebSocket(`ws://localhost:5180/ws/chat?token=${token}`);

        ws.current.onmessage = (event) => {
            setMessages((prev) => [...prev, JSON.parse(event.data)]);
        };

        ws.current.onclose = () => {
            console.log("WebSocket закрито");
        };

        return () => ws.current.close();
    }, [currentUser]);

    const sendMessage = () => {
        if (ws.current && input.trim()) {
            ws.current.send(JSON.stringify({ sender: currentUser?.fullName, text: input }));
            setInput("");
        }
    };

    return (
        <Container maxW="md" p={4}>
            <Box p={4} borderWidth={1} borderRadius="lg" boxShadow="md">
                <Text fontSize="2xl" mb={2}>Чат</Text>
                <Divider />
                <VStack spacing={2} align="start" height="300px" overflowY="auto" p={2}>
                    {messages.map((msg, index) => (
                        <Box
                            key={index}
                            alignSelf={msg.sender === currentUser?.fullName ? "end" : "start"}
                            bg={msg.sender === currentUser?.fullName ? "blue.200" : "gray.200"}
                            p={2}
                            borderRadius="md"
                        >
                            <Text fontSize="sm" fontWeight="bold">{msg.sender}</Text>
                            <Text>{msg.text}</Text>
                        </Box>
                    ))}
                </VStack>
                <HStack mt={4}>
                    <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Введіть повідомлення..." />
                    <Button onClick={sendMessage} colorScheme="blue">Відправити</Button>
                </HStack>
            </Box>
        </Container>
    );
}

export default ChatDashboard;
