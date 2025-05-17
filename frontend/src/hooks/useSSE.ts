import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { getSseUrl } from "../utils/urls";
import { getActiveChatId } from "../utils/chatState";

export function useSSE() {
    const toast = useToast();
    const token = localStorage.getItem("access_token");
    const sseUrl = getSseUrl("stream", { token: token! });

    useEffect(() => {
        const source = new EventSource(sseUrl);

        source.addEventListener("new_message_notification", (event) => {
            const payload = JSON.parse(event.data);
            const { chat_id, fullName, message } = payload;

            // Не показуємо повідомлення, якщо ми в цьому чаті
            const current = getActiveChatId();
            if (chat_id === current) return; // 🔕 Користувач уже в цьому чаті


            toast({
                position: "top",
                variant: "left-accent",
                title: fullName,
                description: message,
                status: "info",
                duration: 5000,
                isClosable: true,
            });
        });

        source.onerror = (err) => {
            console.warn("❌ SSE connection error", err);
            source.close();
        };

        return () => {
            source.close();
        };
    }, [sseUrl, toast]); // eslint-disable-line react-hooks/exhaustive-deps
}
