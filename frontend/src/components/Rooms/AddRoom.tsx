import { CloseIcon } from "@chakra-ui/icons";
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
  ModalOverlay,
  Switch,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { type ApiError, RoomService, MediaService, type RoomCreate } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import { useTranslation } from "react-i18next"

interface FileDetail {
  name: string;
  size: string;
  file: File;
  preview?: string;
}

interface RoomCreateExtended extends RoomCreate {
  image: string; // URL зображення
}

interface AddRoomProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddRoom = ({ isOpen, onClose }: AddRoomProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<FileDetail | null>(null); // Змінено на один файл

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoomCreateExtended>({
    mode: "onBlur",
    defaultValues: {
      name_room: "",
      description: "",
      status: false,
      is_channel: false,
      image: "",
    },
  });

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const selectedFile = event.target.files[0]; // Беремо тільки один файл
    const newFile: FileDetail = {
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
    };

    setFile(newFile);
  };

  const handleRemoveFile = () => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFile(null);
  };

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

  const mutation = useMutation({
    mutationFn: async (jsonPayload: RoomCreateExtended) => {
      // @ts-ignore
      await RoomService.createRoom(jsonPayload);
    },
    onSuccess: () => {
      showToast("Success!", t("addRoom.success"), "success");
      reset();
      setFile(null);
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onSubmit: SubmitHandler<RoomCreateExtended> = async (data) => {
    let imageUrl = "";

    if (file) {
      try {
        imageUrl = await uploadImage(file.file);
      } catch (error) {
        showToast("Error", t("addRoom.imageUploadError"), "error");
        return;
      }
    }

    const payload: RoomCreateExtended = {
      name_room: data.name_room,
      description: data.description,
      status: data.status,
      is_channel: data.is_channel,
      image: imageUrl, // Додаємо URL зображення
    };

    await mutation.mutateAsync(payload);
  };

  return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>{t("addRoom.title")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mt={4} isInvalid={!!errors.name_room}>
              <FormLabel htmlFor="name_room">{t("addRoom.name")}</FormLabel>
              <Input id="name_room" {...register("name_room")} placeholder={t("addRoom.namePlaceholder")}/>
              {errors.name_room && <FormErrorMessage>{errors.name_room.message}</FormErrorMessage>}
            </FormControl>

            <FormControl mt={4} isInvalid={!!errors.description}>
              <FormLabel htmlFor="description">{t("addRoom.description")}</FormLabel>
              <Input id="description" {...register("description")} placeholder={t("addRoom.descriptionPlaceholder")} />
              {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
            </FormControl>

            <FormControl mt={4}>
              <FormLabel htmlFor="image">{t("addRoom.image")}</FormLabel>
              <Input
                  ref={fileInputRef}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  hidden
                  disabled={isSubmitting}
              />
              <Button colorScheme="teal" variant="outline" onClick={handleFileButtonClick} mt={2} isLoading={isSubmitting}>
                {t("addRoom.upload")}
              </Button>
              <Card>
                {file && (
                    <List spacing={2} mt={2}>
                      <ListItem display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={3}>
                          <img src={file.preview} alt={file.name} width="50" height="50" style={{ borderRadius: "5px" }} />
                          {file.name} - {file.size}
                        </Box>
                        <IconButton icon={<CloseIcon />} aria-label="Remove file" onClick={handleRemoveFile} />
                      </ListItem>
                    </List>
                )}
              </Card>
            </FormControl>

            <FormControl mt={4} isInvalid={!!errors.status}>
              <FormLabel htmlFor="status" display="flex" alignItems="center" gap={2}>
                <Box width="12px" height="12px" borderRadius="full" bg={watch("status") ? "green.500" : "red.500"} />
                {t("addRoom.status")}
              </FormLabel>
              <Switch id="status" {...register("status")} colorScheme="teal" />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel htmlFor="status" display="flex" alignItems="center" gap={2}>
                <Box width="12px" height="12px" borderRadius="full" bg={watch("is_channel")? "green.500" : "red.500"} />
                {t("addRoom.isChannel")}
              </FormLabel>
              <Switch id="is_channel" {...register("is_channel")} colorScheme="teal" />
            </FormControl>

          </ModalBody>




          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {t("addRoom.save")}
            </Button>
            <Button onClick={onClose}>{t("addRoom.cancel")}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
};

export default AddRoom;
