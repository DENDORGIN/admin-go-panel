import {
    Avatar, Badge, Box, Flex, Spinner, Text, VStack, useColorModeValue
} from "@chakra-ui/react";
import { type UserPublic } from "../../client";

type Props = {
    users: UserPublic[];
    loading: boolean;
    onSelect: (user: UserPublic) => void;
};

export default function UserListSidebar({ users, loading, onSelect }: Props) {
    const bgColor = useColorModeValue("gray.100", "gray.800");
    const borderColor = useColorModeValue("gray.300", "gray.700");
    const hoverColor = useColorModeValue("gray.200", "gray.600");

    return (
        <Box w={{ base: "100%", md: "320px" }} bg={bgColor} borderRight={{ md: "1px" }} borderColor={borderColor} px={4} py={6} overflowY="auto">

        <Text fontSize="lg" fontWeight="semibold" mb={4} pt={8}>Користувачі</Text>
            {loading ? (
                <Flex justify="center" mt={4}><Spinner size="sm" /></Flex>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {users.map((u) => (
                        <Flex key={u.ID} align="center" gap={3} p={2} borderRadius="md"
                        _hover={{ bg: hoverColor }} cursor="pointer"
                        onClick={() => onSelect(u)}
                        >

                        <Avatar size="sm" name={u.fullName ?? u.email} src={u.avatar ?? undefined} />
                            <Box>
                                <Flex align="center" gap={2}>
                                    <Text fontWeight="medium">{u.fullName ?? u.email}</Text>
                                    <Badge colorScheme={
                                        u.isSuperUser ? "green" : u.isAdmin ? "blue" : u.isActive ? "yellow" : "red"
                                    }>
                                        {u.isSuperUser ? "SuperUser" : u.isAdmin ? "Admin" : u.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </Flex>
                                <Text fontSize="sm" color="gray.500">{u.email}</Text>
                            </Box>
                        </Flex>
                    ))}
                </VStack>
            )}
        </Box>
    );
}
