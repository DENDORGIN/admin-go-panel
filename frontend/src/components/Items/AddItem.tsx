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
  Select,
  Switch,
  useDisclosure,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { CloseIcon } from "@chakra-ui/icons"
import { useRef, useState } from "react"
import { type ApiError, type ItemCreate, ItemsService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import PropertiesModal from "../Modals/PropertiesModal"


import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

interface FileDetail {
  name: string
  size: string
}

interface AddItemProps {
  isOpen: boolean
  onClose: () => void
}

const AddItem = ({ isOpen, onClose }: AddItemProps) => {
  const {
    isOpen: isPropertiesOpen,
    onOpen: onPropertiesOpen,
    onClose: onPropertiesClose,
  } = useDisclosure()
  const [properties, setProperties] = useState({})

  const handleSaveProperties = (props: any) => {
    console.log(props)
    setProperties(props)
  }

  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileDetail[]>([]) // Typing the state with FileDetail[]
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      description: "",
      status: false,
    },
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

  const handleRemoveFile = ({ index }: { index: any }) => {
    const updatedFiles = files.filter((_, idx) => idx !== index)
    setFiles(updatedFiles)
    // Additionally, you need to update the actual file input if necessary
  }

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => ItemsService.createItem(formData),
    onSuccess: () => {
      showToast("Success!", "Item created successfully.", "success")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const onSubmit: SubmitHandler<ItemCreate> = async (data) => {
    const images = watch("images");
    if (!images || images.length === 0) {
      showToast("Error", "Please upload at least one image.", "error");
      return;
    }

    const formData = new FormData()
    formData.append("title", data.title)
    if (data.description) formData.append("description", data.description)
    formData.append("description_second", data.description_second || "")
    console.log("Submitting properties:", JSON.stringify(properties))
    formData.append("properties", JSON.stringify(properties))
    formData.append("status", String(data.status))
    formData.append("category", data.category)
    if (data.item_url) formData.append("item_url", data.item_url)
    formData.append("language", data.language)
    formData.append("position", String(data.position))

    console.log(
      "Form Data for Submission:",
      Object.fromEntries(formData.entries()),
    )
    Array.from(images).forEach((file) => {
      formData.append("images", file);
    });
    await mutation.mutateAsync(formData)
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
        <ModalHeader>Add Item</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel htmlFor="title">Title</FormLabel>
            <Input
              id="title"
              {...register("title", { required: "Title is required." })}
              placeholder="Title"
              type="text"
            />
            {errors.title && (
              <FormErrorMessage>{errors.title.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.description}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <ReactQuill
                theme="snow"
                value={watch('description')  || ''}
                onChange={(_, __, ___, editor) => {
                  setValue('description', editor.getHTML()); // Update form state with HTML content
                }}
            />
            {errors.description && (
                <FormErrorMessage>{errors.description.message}</FormErrorMessage>
            )}
          </FormControl >
          <FormLabel mt={4} htmlFor="properties">Properties</FormLabel>
          <Button variant="primary" onClick={onPropertiesOpen}>Add Properties</Button>
          <PropertiesModal
            isOpen={isPropertiesOpen}
            onClose={onPropertiesClose}
            onSave={handleSaveProperties}
          />

          {/*<FormControl mt={4} isInvalid={!!errors.description_second}>*/}
          {/*  <FormLabel htmlFor="description_second">*/}
          {/*    Description Second*/}
          {/*  </FormLabel>*/}
          {/*  <Textarea*/}
          {/*    id="description_second"*/}
          {/*    {...register("description_second")}*/}
          {/*    placeholder="Description Second"*/}
          {/*  />*/}
          {/*</FormControl>*/}

          <FormControl mt={4} isInvalid={!!errors.images}>
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
            {errors.images && (
              <FormErrorMessage>{errors.images.message}</FormErrorMessage>
            )}
            <Button
              colorScheme="teal"
              variant="primary"
              onClick={handleFileButtonClick}
              mt={4}
              isLoading={isSubmitting}
            >
              Upload Images
            </Button>
            <Card>
              <CardBody>
                {files.length > 0 && (
                  <List spacing={2} mt={4}>
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
                          onClick={() => handleRemoveFile({ index: index })}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardBody>
            </Card>
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.category}>
            <FormLabel htmlFor="category">Category</FormLabel>
            <Select
              placeholder="Select Categories"
              {...register("category", {
                required: "Please select a category",
              })}
            >
              <option value="Angels">Angels</option>
              <option value="Buddy">Buddy</option>
              <option value="Pots and Drinkers">Pots and Drinkers</option>
              <option value="Animals">Animals</option>
            </Select>
            {errors.category && (
              <FormErrorMessage>{errors.category.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4}>
            <FormLabel htmlFor="url">URL</FormLabel>
            <Input
              id="item_url"
              {...register("item_url", { required: "URL is required." })}
              placeholder="URL"
              type="text"
            />
            {errors.item_url && (
              <FormErrorMessage>{errors.item_url.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.language}>
            <FormLabel htmlFor="language">Language</FormLabel>
            <Select
              placeholder="Select language"
              {...register("language", {
                required: "Please select a language",
              })}
            >
              <option value="PL">PL</option>
              <option value="EN">EN</option>
              <option value="DE">DE</option>
            </Select>
            {errors.language && (
              <FormErrorMessage>{errors.language.message}</FormErrorMessage>
            )}
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
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddItem
