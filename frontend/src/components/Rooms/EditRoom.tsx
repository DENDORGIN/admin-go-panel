import {
  Box,
  Button,
  Card,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay, Switch,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { CloseIcon } from "@chakra-ui/icons";
import { useRef, useState, useEffect } from "react";
import {
  type ApiError,
  MediaService,
  type RoomPublic,
  RoomService,
  type RoomUpdate,
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";

interface EditRoomProps {
  room: RoomPublic;
  isOpen: boolean;
  onClose: () => void;
}

interface FileDetail {
  name: string;
  size: string;
  file: File;
  preview?: string;
}

interface RoomUpdateExtended extends RoomUpdate {
  image: string;
}

const EditRoom = ({ room, isOpen, onClose }: EditRoomProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<FileDetail | null>(null);
  const [existingImage, setExistingImage] = useState<string>(room.image || "");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<RoomUpdateExtended>({
    mode: "onBlur",
    defaultValues: {
      ...room,
      image: "",
    },
  });

  // Оновлення форми при відкритті
  useEffect(() => {
    if (isOpen) {
      reset({
        ...room,
        image: "",
      });

      setExistingImage(room.image || "");
      setFile(null);
    }
  }, [isOpen, room, reset]);

  // Завантаження зображення
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await MediaService.downloadOneImage(formData);
      if (!response) throw new Error("Image upload failed");
      return response;
    } catch (error) {
      throw new Error("Image upload error: " + error);
    }
  };

  // Видалення зображення
  const handleDeleteImage = async () => {
    if (!existingImage) return;

    try {
      await MediaService.deleteImageInUrl(existingImage);
      setExistingImage("");
      setValue("image", "", { shouldDirty: true });
      showToast("Success!", "Image deleted successfully.", "success");
    } catch (err) {
      handleError(err as ApiError, showToast);
    }
  };

  // Вибір нового файлу
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const selectedFile = event.target.files[0];
    const newFile: FileDetail = {
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
    };

    setFile(newFile);
    setValue("image", "", { shouldDirty: true });
  };

  // Видалення вибраного файлу
  const handleRemoveFile = () => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFile(null);
    setValue("image", "", { shouldDirty: true });
  };

  // Мутація оновлення кімнати
  const mutation = useMutation({
    mutationFn: async (jsonPayload: RoomUpdateExtended) => {
      // @ts-ignore
      await RoomService.updateRoom(room.ID, jsonPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      showToast("Success!", "Room updated successfully.", "success");
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
  });

  // Відправка форми
  const onSubmit: SubmitHandler<RoomUpdateExtended> = async (data) => {
    let imageUrl = existingImage;

    // Завантажуємо нове зображення, якщо вибране
    if (file) {
      try {
        imageUrl = await uploadImage(file.file);
      } catch (error) {
        showToast("Error", "Failed to upload image", "error");
        return;
      }
    }

    const payload: RoomUpdateExtended = {
      name_room: data.name_room,
      description: data.description,
      status: data.status,
      image: imageUrl, // Додаємо URL зображення
    };

    await mutation.mutateAsync(payload);
  };

  return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Edit Room</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mt={4} isInvalid={!!errors.name_room}>
              <FormLabel htmlFor="name_room">Name Room</FormLabel>
              <Input id="name_room" {...register("name_room")} placeholder="Room name" />
              {errors.name_room && <FormErrorMessage>{errors.name_room.message}</FormErrorMessage>}
            </FormControl>

            <FormControl mt={4} isInvalid={!!errors.description}>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Input id="description" {...register("description")} placeholder="Description" />
              {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
            </FormControl>

            {/* Завантаження нового зображення */}
            <FormControl mt={4}>
              <FormLabel htmlFor="image">Image</FormLabel>
              <Input
                  ref={fileInputRef}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  hidden
                  disabled={isSubmitting}
              />
              <Button colorScheme="teal" variant="outline" onClick={() => fileInputRef.current?.click()} mt={2}>
                Upload Image
              </Button>

              {/* Перегляд нового файлу */}
              {file && (
                  <Card mt={2} p={3}>
                    <List spacing={2}>
                      <ListItem display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={3}>
                          <img src={file.preview} alt={file.name} width="50" height="50" style={{ borderRadius: "5px" }} />
                          {file.name} - {file.size}
                        </Box>
                        <IconButton icon={<CloseIcon />} aria-label="Remove file" onClick={handleRemoveFile} />
                      </ListItem>
                    </List>
                  </Card>
              )}
            </FormControl>

            {/* Перегляд поточного зображення */}
            {existingImage && (
                <Box mt={4}>
                  <FormLabel>Current Image</FormLabel>
                  <Box position="relative">
                    <img src={existingImage} alt="Current" width="100" height="100" style={{ borderRadius: "5px" }} />
                    <IconButton
                        icon={<CloseIcon />}
                        aria-label="Remove current image"
                        position="absolute"
                        top="5px"
                        right="5px"
                        size="xs"
                        onClick={handleDeleteImage}
                    />
                  </Box>
                </Box>
            )}

            <FormControl mt={4} isInvalid={!!errors.status}>
              <FormLabel htmlFor="status" display="flex" alignItems="center" gap={2}>
                <Box width="12px" height="12px" borderRadius="full" bg={watch("status") ? "green.500" : "red.500"} />
                Status
              </FormLabel>
              <Switch id="status" {...register("status")} colorScheme="teal" />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" variant="primary" isLoading={isSubmitting} isDisabled={!isDirty && !file}>
              Save
            </Button>
            <Button onClick={onClose} ml={3}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
};

export default EditRoom;
