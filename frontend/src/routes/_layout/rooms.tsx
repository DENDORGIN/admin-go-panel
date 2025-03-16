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
    Menu,
    MenuButton,
    IconButton,
    MenuList,
    MenuItem,
    useDisclosure,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { StarIcon, HamburgerIcon } from "@chakra-ui/icons";
import { z } from "zod";
import { useRef } from "react";

import { RoomService, type RoomPublic } from "../../client";
import AddRoom from "../../components/Rooms/AddRoom";
import useCustomToast from "../../hooks/useCustomToast.ts";

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

function RoomGrid({ onDeleteRoom }: { onDeleteRoom: (room: RoomType) => void }) {
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
                    transformedRooms.map((room) => (
                        <RoomCard key={room.ID} room={room} onDelete={() => onDeleteRoom(room)} />
                    ))
                ) : (
                    <Text textAlign="center" w="full">
                        No rooms available.
                    </Text>
                )}
        </SimpleGrid>
    );
}

function RoomCard({ room, onDelete }: { room: RoomType; onDelete: () => void }) {
    const navigate = useNavigate();

    const handleOpenChat = () => {
        navigate({ to: `/chat/${room.ID}` });
    };

    return (
        <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" position="relative">
            <Image src={room.image} alt={room.name_room} objectFit="cover" height="200px" width="100%" />

            {/* Меню з опціями */}
            <Box position="absolute" top="10px" right="10px" zIndex={10}>
                <Menu>
                    <MenuButton
                        as={IconButton}
                        aria-label="Options"
                        icon={<HamburgerIcon />}
                        variant="primary"
                        size="sm"
                    />
                    <MenuList>
                        <MenuItem>Update Room</MenuItem>
                        <MenuItem onClick={onDelete} color="red.500">
                            Delete Room
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Box>

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

                <Button mt={4} variant="primary" width="full" onClick={handleOpenChat}>
                    View Room
                </Button>
            </Box>
        </Box>
    );
}

function Room() {
    const cancelRef = useRef<HTMLButtonElement | null>(null); // 🛠 Додано useRef
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
    const queryClient = useQueryClient();
    const showToast = useCustomToast();

    const deleteMutation = useMutation({
        mutationFn: async (roomId: string) => {
            await RoomService.deleteRoom(roomId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
            showToast("Success!", "Room is deleted.", "success");
            onClose();
        },
        onError: (error: any) => {
            console.error("Error deleting room:", error);

            if (error?.status === 401) {
                showToast("Unauthorized", "You are not authorized to perform this action.", "error");
            } else {
                showToast("Error", error.message || "Something went wrong. Please try again.", "error");
            }
        },
    });

    const handleDeleteRoom = (room: RoomType) => {
        setSelectedRoom(room);
        onOpen();
    };

    const confirmDelete = () => {
        if (selectedRoom) {
            deleteMutation.mutate(selectedRoom.ID);
        }
    };

    return (
        <Container maxW="full">
            <Heading size="lg" textAlign="center" pt={12}>
                Chat Rooms
            </Heading>
            <RoomGrid onDeleteRoom={handleDeleteRoom} />

            <Button
                position="fixed"
                bottom="100px"
                right="40px"
                variant="primary"
                size="lg"
                borderRadius="full"
                zIndex={1000}
                boxShadow="lg"
                onClick={() => setIsAddRoomOpen(true)}
            >
                + Add Room
            </Button>
            <AddRoom isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} />

            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Room
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure? You can't undo this action afterwards.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Container>
    );
}

export default Room;
