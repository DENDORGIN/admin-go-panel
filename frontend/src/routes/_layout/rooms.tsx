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
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { createFileRoute } from "@tanstack/react-router"
import { StarIcon } from "@chakra-ui/icons"
import { z } from "zod"

import { RoomService, type RoomPublic } from "../../client"

// 🔹 Типізація кімнат
interface RoomType {
    ID: string;
    name_room: string;
    description: string;
    image: string;
    status: boolean;
}

// 🔹 Схема валідації URL-параметрів
const postsSearchSchema = z.object({
    page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/rooms")({
    component: Room,
    validateSearch: (search) => postsSearchSchema.parse(search),
})

const PER_PAGE = 6

function gePostQueryOptions({ page }: { page: number }) {
    return {
        queryFn: () =>
            RoomService.readRooms({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
        queryKey: ["posts", { page }],
    }
}

function RoomGrid() {
    const { page } = Route.useSearch()

    const {
        data: rooms,
        isPending,
    } = useQuery({
        ...gePostQueryOptions({ page }),
    })

    // 🔹 Перетворення `RoomPublic` → `RoomType`
    const transformedRooms: RoomType[] = Array.isArray(rooms?.Data)
        ? rooms.Data.map((room: RoomPublic) => ({
            ID: room.ID,
            name_room: room.name_room,
            description: room.description || "No description available",
            image: room.image || "https://via.placeholder.com/400",
            status: room.status ?? false, // Додаємо `status`, якщо його немає
        }))
        : []

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
    )
}

// ✅ Додано типізацію для `room`
function RoomCard({ room }: { room: RoomType }) {

    const navigate = useNavigate()

    const handleOpenChat = () => {
        navigate({ to: `/chat/${room.ID}` }) // Перехід до чату конкретної кімнати
    }
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
                        34 reviews
                    </Text>
                </Flex>

                <Button mt={4} colorScheme="blue" width="full" onClick={handleOpenChat}>
                    View Room
                </Button>
            </Box>
        </Box>
    )
}

function Room() {
    return (
        <Container maxW="full">
            <Heading size="lg" textAlign="center" pt={12}>
                Chat Rooms
            </Heading>
            <RoomGrid />
        </Container>
    )
}

export default Room
