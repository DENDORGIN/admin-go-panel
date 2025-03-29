import {
    Box,
    VStack,
    HStack,
    Image,
    Text,
    Tooltip,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerCloseButton,
    DrawerBody,
    Button,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import { FaUsers } from "react-icons/fa";
import { useBreakpointValue } from "@chakra-ui/react";
import React, { useState } from "react";
import UserProfileModal from "../Modals/UserProfileModal"; // переконайся в правильному шляху

interface User {
    id: string;
    full_name: string;
    avatar: string;
    lastMessageTime: number;
}

interface Props {
    users: User[];
    onlineIds: string[];
}

const UserList: React.FC<Props> = ({ users, onlineIds }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const isMobile = useBreakpointValue({ base: true, md: false });

    const {
        isOpen: isProfileOpen,
        onOpen: openProfile,
        onClose: closeProfile,
    } = useDisclosure();

    const [selectedUser, setSelectedUser] = useState<null | {
        user_id: string;
        full_name: string;
        avatar: string;
    }>(null);

    const handleUserClick = (user: User) => {
        setSelectedUser({
            user_id: user.id,
            full_name: user.full_name,
            avatar: user.avatar,
        });
        openProfile();
    };

    const list = (
        <VStack align="stretch" spacing={1}>
            {users.map((user) => (
                <HStack
                    key={user.id}
                    spacing={3}
                    cursor="pointer"
                    _hover={{
                        bg: useColorModeValue("gray.100", "gray.700"),
                        borderRadius: "md",
                    }}
                    p={2}
                    onClick={() => handleUserClick(user)}
                >
                    <Box position="relative">
                        <Image
                            src={user.avatar}
                            alt={user.full_name}
                            boxSize="35px"
                            borderRadius="full"
                        />
                        <Box
                            position="absolute"
                            bottom="0"
                            right="0"
                            boxSize="10px"
                            bg={onlineIds.includes(user.id) ? "green.400" : "gray.400"}
                            borderRadius="full"
                            border="2px solid white"
                        />
                    </Box>
                    <Tooltip label={user.full_name} hasArrow placement="right">
                        <Text fontSize="sm" isTruncated>
                            {user.full_name}
                        </Text>
                    </Tooltip>
                </HStack>
            ))}
        </VStack>
    );

    return (
        <>
            {isMobile && (
                <>
                    <Button
                        position="absolute"
                        top="1rem"
                        right="1rem"
                        zIndex={10}
                        onClick={onOpen}
                        display={{ base: "block", md: "none" }}
                        size="md"
                        variant="ghost"
                    >
                        <FaUsers />
                    </Button>

                    <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerCloseButton />
                            <DrawerHeader>Учасники</DrawerHeader>
                            <DrawerBody>{list}</DrawerBody>
                        </DrawerContent>
                    </Drawer>
                </>
            )}
            {!isMobile && (
                <Box
                    w="200px"
                    pr={4}
                    overflowY="auto"
                    mt={16}
                    display={{ base: "none", md: "block" }}
                >
                    {list}
                </Box>
            )}

            {/* 👤 Модалка профілю */}
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={closeProfile}
                user={selectedUser}
                onStartPrivateChat={(userId) => {
                    // TODO: реалізуй логіку відкриття приватного чату
                    console.log("🟢 Старт приватного чату з:", userId);
                }}
            />

        </>
    );
};

export default UserList;
