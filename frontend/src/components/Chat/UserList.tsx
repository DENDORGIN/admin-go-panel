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
    IconButton,
    useColorModeValue,
    useDisclosure,
    Collapse,
    Flex,
} from "@chakra-ui/react";
import { FaUsers } from "react-icons/fa";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useBreakpointValue } from "@chakra-ui/react";
import React, { useState } from "react";
import UserProfileModal from "../Modals/UserProfileModal";

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

    const hoverBg = useColorModeValue("gray.100", "gray.700");


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

    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleCollapse = () => setIsCollapsed(prev => !prev);

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
                    _hover={{ bg: hoverBg, borderRadius: "md" }}
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
                        right="0.5"
                        zIndex={10}
                        onClick={onOpen}
                        display={{ base: "block", md: "none" }}
                        size="lg"
                        variant="ghost"
                        color="teal.400"
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
                    w={isCollapsed ? "40px" : "200px"}
                    pr={4}
                    overflowY="auto"
                    mt={16}
                    display={{ base: "none", md: "block" }}
                    transition="width 0.3s ease"
                >
                    <Flex justify="space-between" align="center" px={2} mb={2}>
                        {isCollapsed ? null : (
                            <Text fontWeight="bold" fontSize="md">Users</Text>
                        )}
                        <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label="toggle"
                            icon={isCollapsed ?
                                <ChevronRightIcon boxSize="30px"
                                                  color="teal.400"/> : <ChevronLeftIcon boxSize="30px"
                                                                                        color="teal.400"/>}
                            onClick={toggleCollapse}
                        />
                    </Flex>
                    <Collapse in={!isCollapsed} animateOpacity>
                        {list}
                    </Collapse>
                </Box>
            )}

            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={closeProfile}
                user={selectedUser}
            />
        </>
    );
};

export default UserList;
