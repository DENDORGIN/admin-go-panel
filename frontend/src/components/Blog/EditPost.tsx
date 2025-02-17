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
  Textarea,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
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

interface EditPostProps {
  post: PostPublic
  isOpen: boolean
  onClose: () => void
}

interface FileDetail {
  name: string
  size: string
}

const EditPost = ({ post, isOpen, onClose }: EditPostProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileDetail[]>([])
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<PostUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { ...post, images: undefined },
  })

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).map(
      (file: File) => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, // Convert size to MB
      }),
    )
    setFiles([...files, ...selectedFiles]) // Append new files to the existing array
    setFiles([...files, ...selectedFiles]) // Append new files to the existing array
    setValue(
      "images",
      event.target.files ? Array.from(event.target.files) : undefined,
      { shouldValidate: true },
    )
  }

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, idx) => idx !== index)
    setFiles(updatedFiles)
  }

  const onSubmit: SubmitHandler<PostUpdate> = async (data) => {
    const formData = new FormData()
    formData.append("title", data.title || "")
    formData.append("description", data.content || "")
    formData.append("position", String(data.position))
    formData.append("status", String(data.status))

    const images = watch("images") as FileList | null
    if (images && images.length > 0) {
      Array.from(images).forEach((file) => {
        formData.append("images", file)
      })
    }

    try {
      await BlogService.updatePost(post.ID, formData)
      showToast("Success!", "Post updated successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      onClose()
    } catch (err) {
      handleError(err as ApiError, showToast)
    }
  }

  const onCancel = () => {
    reset({ ...post, images: undefined })
    onClose()
  }

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
          <FormControl mt={4}>
            <FormLabel htmlFor="content">Content</FormLabel>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Content"
            />
          </FormControl>

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
          <Button onClick={onCancel}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditPost
