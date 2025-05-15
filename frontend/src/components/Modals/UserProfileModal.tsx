import {
    Avatar,
    Box,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Text,
    useColorModeValue,
    VStack,
    Button
} from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { DirectService} from "../../client";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        full_name: string;
        avatar: string;
        user_id: string;
        acronym: string;
    } | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
    if (!user) return null;

    const bg = useColorModeValue("white", "gray.800");
    const navigate = useNavigate();

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent bg={bg}>
                <ModalHeader>Профіль користувача</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="center">
                        <Avatar size="xl" src={user.avatar} />
                        <Box textAlign="center">
                            <Text fontWeight="bold">{user.full_name}</Text>
                            <Text fontSize="sm" color="gray.500">
                                ACRONYM: {user.acronym}
                            </Text>
                        </Box>

                        <Button
                            colorScheme="teal"
                            onClick={async () => {
                                if (!user?.user_id) return;

                                try {
                                    await DirectService.getOrPostChats({ user_id: user.user_id });
                                    // ✅ Перенаправлення по userId або chatId
                                    await navigate({ to: "/direct", search: { userId: user.user_id } });
                                    onClose();
                                } catch (err) {
                                    console.error("❌ Не вдалося створити чат:", err);
                                }
                            }}
                            w="100%"
                        >
                            Написати повідомлення
                        </Button>

                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default UserProfileModal;
