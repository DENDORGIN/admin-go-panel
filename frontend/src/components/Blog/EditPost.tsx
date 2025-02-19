import {
  Box,
  Button,
  Card,
  CardBody,
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
} from "@chakra-ui/react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { CloseIcon } from "@chakra-ui/icons"
import { useRef, useState } from "react"
import {
  type ApiError,
  BlogService,
  type PostPublic,
  type PostUpdate,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import ReactQuill from "react-quill";

interface EditPostProps {
  post: PostPublic
  isOpen: boolean
  onClose: () => void
}

interface FileDetail {
  name: string;
  size: string;
  file: File;
}

interface PostUpdateExtended extends PostUpdate {
  images?: File[];
}

const EditPost = ({ post, isOpen, onClose }: EditPostProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileDetail[]>([])

  const [existingImages, setExistingImages] = useState<string[]>(
      Array.isArray(post.images) ? post.images : post.images ? post.images.split(',') : []
  );

  // const [newFiles, setNewFiles] = useState<FileDetail[]>([]);


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<PostUpdateExtended>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { ...post, images: undefined },
  })

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const selectedFiles = Array.from(event.target.files).map((file) => ({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      file,
    }));

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

    setValue(
        "images",
        [...(watch("images") || []), ...selectedFiles.map((f) => f.file)],
        { shouldValidate: true }
    );
  };


  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, idx) => idx !== index)
    setFiles(updatedFiles)
  }

  const mutation = useMutation({
    mutationFn: async (jsonPayload: PostUpdateExtended) => {
      // Створюємо пост
      // @ts-ignore
      const postResponse = await BlogService.updatePost(post.ID, jsonPayload);
      const postId = postResponse.ID;

      // Отримуємо файли
      const images = jsonPayload.images;
      if (postId && images && images.length > 0) {
        const formData = new FormData();

        images.forEach((file) => {
          formData.append("files", file);
        });

        console.log("Uploading images:", formData.getAll("images")); // Дебаг

        await BlogService.downloadImages(postId, formData);
      } else {
        console.warn("No images to upload.");
      }
    },
    onSuccess: () => {
      showToast("Success!", "Post created successfully.", "success");
      reset();
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // const handleRemoveNewFile = (index: number) => {
  //   setNewFiles((prev) => prev.filter((_, i) => i !== index));
  // };


  const onSubmit: SubmitHandler<PostUpdateExtended> = async (data) => {
    const payload: PostUpdateExtended = {
      title: data.title,
      position: data.position,
      content: data.content,
      status: data.status,
      images: files.map((f) => f.file), // Передаємо файли
    };

    await mutation.mutateAsync(payload);
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "xl", xl: "xl" }}
      isCentered
    >
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Edit Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel htmlFor="title">Title</FormLabel>
            <Input
              id="title"
              {...register("title", { required: "Title is required" })}
              placeholder="Title"
              type="text"
            />
            {errors.title && (
              <FormErrorMessage>{errors.title.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.content}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <ReactQuill
                theme="snow"
                value={watch('content')  || ''}
                onChange={(_, __, ___, editor) => {
                  setValue('content', editor.getHTML()); // Update form state with HTML content
                }}
            />
            {errors.content && (
                <FormErrorMessage>{errors.content.message}</FormErrorMessage>
            )}
          </FormControl >

          <FormControl mt={4}>
            <FormLabel htmlFor="images">Images</FormLabel>
            <Input
              ref={fileInputRef}
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              hidden
              disabled={isSubmitting}
            />
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={handleFileButtonClick}
              mt={2}
              isLoading={isSubmitting}
            >
              Upload Images
            </Button>
            <Card>
              <CardBody>
                {files.length > 0 && (
                  <List spacing={2} mt={2}>
                    {files.map((file, index) => (
                      <ListItem
                        key={index}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        {file.name} - {file.size}
                        <IconButton
                          icon={<CloseIcon />}
                          aria-label="Remove file"
                          onClick={() => handleRemoveFile(index)}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardBody>
            </Card>
          </FormControl>

          {existingImages.length > 0 && (
              <Box mt={4}>
                <FormLabel>Existing Images</FormLabel>
                <List spacing={2}>
                  {existingImages.map((image, index) => (
                      <ListItem key={index} display="flex" alignItems="center" justifyContent="space-between">
                        <img src={image} alt={`Uploaded ${index}`} width="100" style={{ borderRadius: "5px" }} />
                        <IconButton
                            icon={<CloseIcon />}
                            aria-label="Remove existing image"
                            onClick={() => handleRemoveExistingImage(index)}
                        />
                      </ListItem>
                  ))}
                </List>
              </Box>
          )}


          <FormControl mt={4} isInvalid={!!errors.position}>
            <FormLabel htmlFor="position">Position</FormLabel>
            <Input
              id="position"
              {...register("position", {
                required: "Position is required.",
                valueAsNumber: true,
                min: { value: 1, message: "Position must be greater than 0" },
              })}
              placeholder="Enter position"
              type="number"
            />
            {errors.position && (
              <FormErrorMessage>{errors.position.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.status}>
            <FormLabel
              htmlFor="status"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Box
                width="12px"
                height="12px"
                borderRadius="full"
                bg={watch("status") ? "green.500" : "red.500"}
              />
              Status
            </FormLabel>
            <Switch id="status" {...register("status")} colorScheme="teal" />
          </FormControl>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            isDisabled={!isDirty}
          >
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditPost
