import { useState } from "react";
import {
    Box,
    Container,
    Heading,
    SimpleGrid,
    Image,
    Badge,
    Text,
    Flex,
    Button,
    Skeleton,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { StarIcon } from "@chakra-ui/icons";
import { z } from "zod";

import { RoomService, type RoomPublic } from "../../client";
import AddRoom from "../../components/Rooms/AddRoom";

// 🔹 Типізація кімнат
export interface RoomType {
    ID: string;
    name_room: string;
    description: string;
    image: string;
    status: boolean;
}

// 🔹 Схема валідації URL-параметрів
const roomsSearchSchema = z.object({
    page: z.number().catch(1),
});

export const Route = createFileRoute("/_layout/rooms")({
    component: Room,
    validateSearch: (search) => roomsSearchSchema.parse(search),
});

const PER_PAGE = 6;

function geRoomQueryOptions({ page }: { page: number }) {
    return {
        queryFn: () =>
            RoomService.readRooms({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
        queryKey: ["rooms", { page }],
    };
}

function RoomGrid() {
    const { page } = Route.useSearch();
    const queryClient = useQueryClient();

    const { data: rooms, isPending } = useQuery({
        ...geRoomQueryOptions({ page }),
    });

    const transformedRooms: RoomType[] = Array.isArray(rooms?.Data)
        ? rooms.Data.map((room: RoomPublic) => ({
            ID: room.ID,
            name_room: room.name_room,
            description: room.description || "No description available",
            image: room.image || "https://via.placeholder.com/400",
            status: room.status ?? false,
        }))
        : [];

    queryClient.setQueryData(["rooms"], transformedRooms);

    return (
        <SimpleGrid columns={[1, 2, 3]} spacing={6} py={6}>
            {isPending
                ? [...Array(6)].map((_, index) => (
                    <Skeleton key={index} height="300px" borderRadius="lg" />
                ))
                : transformedRooms.length > 0 ? (
                    transformedRooms.map((room) => <RoomCard key={room.ID} room={room} />)
                ) : (
                    <Text textAlign="center" w="full">
                        No rooms available.
                    </Text>
                )}
        </SimpleGrid>
    );
}

function RoomCard({ room }: { room: RoomType }) {
    const navigate = useNavigate();

    const handleOpenChat = () => {
        navigate({ to: `/chat/${room.ID}` });
    };

    return (
        <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md">
            <Image src={room.image} alt={room.name_room} objectFit="cover" height="200px" width="100%" />
            <Box p="6">
                <Flex alignItems="baseline">
                    <Badge borderRadius="full" px="2" colorScheme={room.status ? "green" : "red"}>
                        {room.status ? "Active" : "Inactive"}
                    </Badge>
                </Flex>

                <Text mt="1" fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {room.name_room}
                </Text>

                <Text fontSize="sm" color="gray.500" noOfLines={2}>
                    {room.description}
                </Text>

                <Flex alignItems="center" mt={2}>
                    {Array(5)
                        .fill("")
                        .map((_, i) => (
                            <StarIcon key={i} color={i < 4 ? "teal.500" : "gray.300"} />
                        ))}
                    <Text ml="2" fontSize="sm" color="gray.600">
                        42 reviews
                    </Text>
                </Flex>

                <Button mt={4} colorScheme="blue" width="full" onClick={handleOpenChat}>
                    View Room
                </Button>
            </Box>
        </Box>
    );
}

function Room() {
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

    return (
        <Container maxW="full">

            <Heading size="lg" textAlign="center" pt={12}>
                Chat Rooms
            </Heading>
            <RoomGrid />

            {/* ✅ Закріплена кнопка "Add Room" */}
            <Button
                position="fixed"
                bottom="100px"
                right="20px"
                variant="primary"
                size="lg"
                borderRadius="full"
                zIndex={1000}
                boxShadow="lg"
                onClick={() => setIsAddRoomOpen(true)} // ✅ Використовуємо useState
            >
                + Add Room
            </Button>

            {/* ✅ Модальне вікно Add Room */}
            <AddRoom isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} />
        </Container>
    );
}

export default Room;
