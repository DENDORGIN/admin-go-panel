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
import EditRoom from "../../components/Rooms/EditRoom";
import useCustomToast from "../../hooks/useCustomToast.ts";
import useAuth from "../../hooks/useAuth.ts";


// 🔹 Типізація кімнат
export interface RoomType {
    ID: string;
    name_room: string;
    description: string;
    image: string;
    status: boolean;
    is_channel: boolean;
    owner_id: string;
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

function RoomGrid({ onDeleteRoom, onEditRoom }: { onDeleteRoom: (room: RoomType) => void; onEditRoom: (room: RoomType) => void }) {
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
            image: room.image || "https://f003.backblazeb2.com/file/admin-go-panel/bhV3vC5_giphy (111).gif",
            status: room.status ?? false,
            is_channel: room.is_channel ?? false,
            owner_id: room.owner_id,
        }))
        : [];

    queryClient.setQueryData(["rooms"], transformedRooms);

    return (
        <SimpleGrid minChildWidth="150px" spacing={2}>
            {isPending
                ? [...Array(6)].map((_, index) => (
                    <Skeleton key={index} height="200px" borderRadius="lg" />
                ))
                : transformedRooms.length > 0 ? (
                    transformedRooms.map((room) => (
                        <RoomCard key={room.ID} room={room} onDelete={() => onDeleteRoom(room)} onEdit={() => onEditRoom(room)} />
                    ))
                ) : (
                    <Text textAlign="center" w="full">
                        No rooms available.
                    </Text>
                )}
        </SimpleGrid>
    );
}

function RoomCard({ room, onDelete, onEdit }: { room: RoomType; onDelete: () => void; onEdit: () => void }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isOwner = room.owner_id === user?.ID

    const handleOpenChat = () => {
        navigate({ to: `/chat/${room.ID}` });
    };

    return (
        <Box maxW="sm" borderWidth="1px"
             borderRadius="lg"
             overflow="hidden"
             boxShadow="md"
             position="relative"
             mt="12"
             _hover={{ transform: "scale(1.05)" }}
             _active={{ transform: "scale(0.95)" }}
             transition="all 0.1s ease-in-out"
             cursor="pointer">
            <Image src={room.image}
                   alt={room.name_room}
                   objectFit="cover"
                   height="100px"
                   width="100%"
                   cursor="pointer"
                   onClick={handleOpenChat}
            />

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
                        <MenuItem onClick={onEdit} isDisabled={!isOwner}>Update Room</MenuItem>
                        <MenuItem onClick={onDelete} isDisabled={!isOwner} color="red.500">
                            Delete Room
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Box>

            <Box p={3} boxSize="auto">
                <Flex alignItems="baseline">
                    <Badge borderRadius="full" px="2" colorScheme={room.status ? "green" : "red"}>
                        {room.status ? "Active" : "Inactive"}
                    </Badge>
                    {room.is_channel && (
                        <Badge variant="outline" borderRadius="full" px="2" colorScheme="orange" ml={3}>
                            Channel
                        </Badge>
                    )}
                </Flex>

                <Text mt="1" fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {room.name_room}
                </Text>

                <Text fontSize="sm" color="gray.500" noOfLines={1}>
                    {room.description}
                </Text>

                <Flex alignItems="left" flexDirection="column" mt={2}>
                    <Flex>
                        {Array(5)
                            .fill("")
                            .map((_, i) => (
                                <StarIcon key={i} color={i < 4 ? "teal.500" : "gray.300"} boxSize={4} />
                            ))}
                    </Flex>
                    <Text mt={1} fontSize="xs" color="gray.600">
                        42 reviews
                    </Text>
                </Flex>


                <Button mt={4} variant="primary" width="full" fontSize="sm" onClick={handleOpenChat}>
                    View Room
                </Button>
            </Box>
        </Box>
    );
}

function Room() {
    const cancelRef = useRef<HTMLButtonElement | null>(null); // 🛠 Додано useRef
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
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

    const handleEditRoom = (room: RoomType) => {
        setSelectedRoom(room);
        setIsEditRoomOpen(true);
    };

    return (
        <Container maxW="full">
            <Heading size="lg" textAlign="center" pt={12}>
                Chat Rooms
            </Heading>
            <RoomGrid onDeleteRoom={handleDeleteRoom} onEditRoom={handleEditRoom} />

            <Button
                position="fixed"
                bottom="50px"
                right="20px"
                variant="primary"
                size="sm"
                borderRadius="full"
                zIndex={1000}
                boxShadow="sm"
                _hover={{ transform: "scale(1.05)" }}
                _active={{ transform: "scale(0.95)" }}
                transition="all 0.1s ease-in-out"
                cursor="pointer"
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
            {selectedRoom && <EditRoom room={selectedRoom} isOpen={isEditRoomOpen} onClose={() => setIsEditRoomOpen(false)} />}
        </Container>
    );
}

export default Room;
