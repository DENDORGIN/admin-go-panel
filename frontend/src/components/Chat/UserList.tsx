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
import { AttachmentIcon } from "@chakra-ui/icons";
import { useBreakpointValue } from "@chakra-ui/react";
import React from "react";

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

    const list = (
        <VStack align="stretch" spacing={1}>
            {users.map((user) => (
                <HStack
                    key={user.id}
                    spacing={3}
                    cursor="pointer"
                    _hover={{ bg: useColorModeValue("gray.100", "gray.700"), borderRadius: "md" }}
                    p={2}
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
                        display={{ base: "block", md: "none" }}
                        onClick={onOpen}
                        mb={2}
                        alignSelf="flex-start"
                        leftIcon={<AttachmentIcon />}
                        size="sm"
                        variant="outline"
                        mt={16}
                    >
                    </Button>
                    <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerCloseButton />
                            <DrawerHeader></DrawerHeader>
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
        </>
    );
};

export default UserList;