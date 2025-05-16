import {
    Avatar, Badge, Box, Flex, Spinner, Text, VStack, useColorModeValue
} from "@chakra-ui/react";
import { type UserPublic } from "../../client";
import { formatLastSeen } from "../../utils/formatLastSeen";

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

                            <Box position="relative">
                                <Avatar size="sm" name={u.fullName ?? u.email} src={u.avatar ?? undefined} />
                                {isUserOnline(u.lastSeenAt) && (
                                    <Box
                                        position="absolute"
                                        bottom={0}
                                        right={0}
                                        boxSize="10px"
                                        bg="green.400"
                                        border="2px solid white"
                                        borderRadius="full"
                                    />
                                )}
                            </Box>

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
                                {/* Онлайн-статус */}
                                <Text fontSize="xs" color={isUserOnline(u.lastSeenAt) ? "green.500" : "gray.500"}>
                                    {isUserOnline(u.lastSeenAt)
                                        ? "Онлайн"
                                        : formatLastSeen(u.lastSeenAt)}
                                </Text>
                            </Box>
                        </Flex>
                    ))}
                </VStack>
            )}
        </Box>
    );
}


function isUserOnline(lastSeenAt?: string | null): boolean {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt).getTime();
    return Date.now() - lastSeen < 60_000; // 1 хв
}
