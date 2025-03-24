import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {useRef, useState} from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type ApiError,
  type UserPublic,
  type UserUpdateMe,
  UsersService, MediaService,
} from "../../client"
import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern, handleError } from "../../utils"

interface FileDetail {
  name: string;
  size: string;
  file: File;
  preview?: string;
}

const UserInformation = () => {
  const queryClient = useQueryClient()
  const color = useColorModeValue("inherit", "ui.light")
  const showToast = useCustomToast()
  const [editMode, setEditMode] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<FileDetail | null>(null);

  const { user: currentUser } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      fullName: currentUser?.fullName,
      email: currentUser?.email,
      avatar: currentUser?.avatar
    },
  })

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
    avatarMutation.mutate(selectedFile); // 🔥 одразу оновлюємо аватар
  };

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadImage(file); // Завантаження картинки
      await UsersService.updateUserMe({ requestBody: { avatar: url } }); // Оновлення
      return url;
    },
    onSuccess: () => {
      showToast("Success!", "Avatar updated", "success");
      queryClient.invalidateQueries(); // Перезавантажити user
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
        UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User updated successfully.", "success");
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });


  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    try {
      let avatarUrl = data.avatar;

      if (file) {
        avatarUrl = await uploadImage(file.file); // Завантажуємо файл і отримуємо url
      }

      const payload: UserUpdateMe = {
        fullName: data.fullName,
        email: data.email,
        avatar: avatarUrl,
      };

      await mutation.mutateAsync(payload);
      setEditMode(false);
      setFile(null);
    } catch (err) {
      showToast("Error", "Failed to update user", "error");
    }
  };


  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  return (
    <>
      <Container maxW="full">
        <Heading size="sm" py={4}>
          User Information
        </Heading>
        <Box
          w={{ sm: "full", md: "50%" }}
          as="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FormControl mt={4}>

            <Input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                hidden
                disabled={isSubmitting}
            />

            <Box
                w="100px"
                h="100px"
                borderRadius="full"
                overflow="hidden"
                cursor="pointer"
                border="2px solid"
                borderColor="gray.200"
                _hover={{ opacity: 0.8 }}
                onClick={handleFileButtonClick}
            >
              <img
                  src={
                      file?.preview ||
                      getValues("avatar") ||
                      currentUser?.avatar ||
                      "https://via.placeholder.com/100x100?text=Avatar"
                  }
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          </FormControl>

          <FormControl mt={4}>
            <FormLabel color={color} htmlFor="name">
              Full name
            </FormLabel>
            {editMode ? (
              <Input
                id="name"
                {...register("fullName", { maxLength: 30 })}
                type="text"
                size="md"
                w="auto"
              />
            ) : (
              <Text
                size="md"
                py={2}
                color={!currentUser?.fullName ? "ui.dim" : "inherit"}
                isTruncated
                maxWidth="250px"
              >
                {currentUser?.fullName || "N/A"}
              </Text>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.email}>
            <FormLabel color={color} htmlFor="email">
              Email
            </FormLabel>
            {editMode ? (
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                type="email"
                size="md"
                w="auto"
              />
            ) : (
              <Text size="md" py={2} isTruncated maxWidth="250px">
                {currentUser?.email}
              </Text>
            )}
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>

          <Flex mt={4} gap={3}>
            <Button
              variant="primary"
              onClick={toggleEditMode}
              type={editMode ? "button" : "submit"}
              isLoading={editMode ? isSubmitting : false}
              isDisabled={editMode ? !isDirty || !getValues("email") : false}
            >
              {editMode ? "Save" : "Edit"}
            </Button>
            {editMode && (
              <Button onClick={onCancel} isDisabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </Flex>
        </Box>
      </Container>
    </>
  )
}

export default UserInformation
