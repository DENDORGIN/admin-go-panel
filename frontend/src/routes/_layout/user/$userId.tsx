import {
  Container,
  Flex,
  Link,
  Spinner,
  Text,
  Box,
  Divider,
  Stack,
  Input,
  FormControl,
  Button,
  IconButton,
} from "@chakra-ui/react"
import { ArrowBackIcon, EditIcon } from "@chakra-ui/icons"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type ApiError,
  EmployeeService,
  type UserEmployeePublic,
} from "../../../client"
import { useNavigate } from "@tanstack/react-router"
import { useState, useRef, useEffect } from "react"
import useAuth from "../../../hooks/useAuth.ts"
import useCustomToast from "../../../hooks/useCustomToast.ts"
import { handleError } from "../../../utils.ts"
import { uploadImage } from "../../../utils/uploadImage.ts"

type EditableUserFields = {
  fullName?: string
  email?: string
  phone_number_1?: string
  phone_number_2?: string
}

export const Route = createFileRoute("/_layout/user/$userId")({
  component: UserDetails,
})

function UserDetails() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<{ file: File; preview: string } | null>(null)
  const showToast = useCustomToast()
  const { user: currentUser } = useAuth()
  const isSuperUser = currentUser?.isSuperUser
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery<UserEmployeePublic>({
    queryKey: ["user", userId],
    queryFn: () => EmployeeService.readEmployeeById({ userId }),
    enabled: !!userId,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setEditedUser({
        fullName: user.fullName ?? "",
        email: user.email,
        phone_number_1: user.phone_number_1 ?? "",
        phone_number_2: user.phone_number_2 ?? "",
      })
    }
  }, [user])

  const updateMutation = useMutation({
    mutationFn: (data: EditableUserFields) =>
        EmployeeService.updateEmployeeById({
          id: userId,
          requestBody: data as any,
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] })
      showToast("Success!", "User info updated", "success")
      setIsEditing(false)
    },
    onError: (err) => {
      handleError(err as ApiError, showToast)
    },
  })


  const handleEditChange = (key: string, value: string) => {
    setEditedUser((prev) => ({ ...prev, [key]: value }))
  }

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isSuperUser) {
        throw new Error("Permission denied")
      }

      const url = await uploadImage(file)
      if (!url) {
        throw new Error("Upload failed")
      }

      await EmployeeService.updateEmployeeById({
        id: userId,
        requestBody: {
          avatar: url, // тепер точно string
        },
      })

      return url
    },
    onSuccess: () => {
      showToast("Success!", "Avatar updated", "success")
      queryClient.invalidateQueries({ queryKey: ["user", userId] })
    },
    onError: (err: ApiError | Error) => {
      if (err instanceof Error && err.message === "Permission denied") {
        showToast("Permission denied", "Only superusers can update avatar", "error")
        return
      }
      if ("status" in err) {
        handleError(err as ApiError, showToast)
      } else {
        showToast("Error", err.message || "Unknown error", "error")
      }
    },
  })


  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return
    if (!isSuperUser) {
      showToast("Permission denied", "Only superusers can update avatar", "error")
      return
    }
    const selectedFile = event.target.files[0]
    const newFile = {
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
    }
    setFile(newFile)
    avatarMutation.mutate(selectedFile)
  }

  function handleFileButtonClick() {
    if (isSuperUser && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (isLoading) {
    return (
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" />
        </Flex>
    )
  }

  if (!user || error) {
    return <Text textAlign="center">Користувача не знайдено або сталася помилка.</Text>
  }

  const avatarSrc = file?.preview || user?.avatar || "https://via.placeholder.com/100x100?text=Avatar"

  return (
      <Container maxW="4xl" py={8}>
        <Link
            onClick={() => navigate({ to: "/admin" })}
            color="blue.500"
            fontWeight="medium"
            mb={4}
            display="inline-flex"
            alignItems="center"
            px={10}
        >
          <ArrowBackIcon mr={2} />
          Back to the user list
        </Link>

        <Stack spacing={6}>
          <Box>
            <Section title="Avatar">
              <FormControl mt={4}>
                <Input
                    ref={fileInputRef}
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    hidden
                    disabled={avatarMutation.isPending}
                />
                <Box
                    w="100px"
                    h="100px"
                    borderRadius="full"
                    overflow="hidden"
                    cursor={isSuperUser ? "pointer" : "not-allowed"}
                    border="2px solid"
                    borderColor="gray.200"
                    _hover={{ opacity: isSuperUser ? 0.8 : 1 }}
                    onClick={handleFileButtonClick}
                >
                  <img
                      src={avatarSrc}
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              </FormControl>
            </Section>
          </Box>

          <Section title="User Information">
            <Flex justify="flex-end" align="center">
              {!isEditing ? (
                  <IconButton
                      icon={<EditIcon />}
                      aria-label="Edit"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                  />
              ) : (
                  <Flex gap={2}>
                    <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={() => updateMutation.mutate(editedUser)}
                        isLoading={updateMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditedUser({
                            fullName: user.fullName ?? "",
                            email: user.email,
                            phone_number_1: user.phone_number_1 ?? "",
                            phone_number_2: user.phone_number_2 ?? "",
                          })
                          setIsEditing(false)
                        }}
                    >
                      Cancel
                    </Button>
                  </Flex>
              )}
            </Flex>

            {!isEditing ? (
                <>
                  <Text><strong>Full name:</strong> {user.fullName ?? "-"}</Text>
                  <Text><strong>Email:</strong> {user.email}</Text>
                  <Text><strong>Phone 1:</strong> {user.phone_number_1 ?? "-"}</Text>
                  <Text><strong>Phone 2:</strong> {user.phone_number_2 ?? "-"}</Text>
                </>
            ) : (
                <Stack spacing={3} mt={4}>
                  <Input
                      placeholder="Full name"
                      value={editedUser.fullName || ""}
                      onChange={(e) => handleEditChange("fullName", e.target.value)}
                  />
                  <Input
                      placeholder="Email"
                      value={editedUser.email || ""}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                  />
                  <Input
                      placeholder="Phone 1"
                      value={editedUser.phone_number_1 || ""}
                      onChange={(e) => handleEditChange("phone_number_1", e.target.value)}
                  />
                  <Input
                      placeholder="Phone 2"
                      value={editedUser.phone_number_2 || ""}
                      onChange={(e) => handleEditChange("phone_number_2", e.target.value)}
                  />
                </Stack>
            )}
          </Section>
        </Stack>
      </Container>
  )
}

function Section({
                   title,
                   children,
                 }: {
  title: string
  children: React.ReactNode
}) {
  return (
      <Box>
        <Box position="relative" mb={2}>
          <Text fontWeight="bold" fontSize="lg" mb={1}>
            {title}
          </Text>
          <Divider />
        </Box>
        <Stack spacing={3}>{children}</Stack>
      </Box>
  )
}
