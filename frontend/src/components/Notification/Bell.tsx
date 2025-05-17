import {
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Badge,
    Text,
    VStack,
} from "@chakra-ui/react";
import { BellIcon } from "@chakra-ui/icons";
import { useNotificationStore } from "../../hooks/useNotificationsStore";

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead } = useNotificationStore();

    return (
        <Menu>
            <MenuButton as={IconButton} icon={<BellIcon />} position="relative">
                {unreadCount > 0 && (
                    <Badge
                        colorScheme="red"
                        position="absolute"
                        top="0"
                        right="0"
                        borderRadius="full"
                        px={2}
                    >
                        {unreadCount}
                    </Badge>
                )}
            </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
                {notifications.length === 0 && (
                    <MenuItem disabled>Немає сповіщень</MenuItem>
                )}
                {notifications.map((n) => (
                    <MenuItem
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        bg={!n.read ? "gray.100" : undefined}
                    >
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{n.title}</Text>
                            <Text fontSize="sm">{n.body}</Text>
                        </VStack>
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
}
