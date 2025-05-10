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
} from "@chakra-ui/react"
import { ArrowBackIcon } from "@chakra-ui/icons"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type ApiError,
  EmployeeService,
  type UserPublic,
} from "../../../client"
import { useNavigate } from "@tanstack/react-router"
import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import useAuth from "../../../hooks/useAuth.ts"
import useCustomToast from "../../../hooks/useCustomToast.ts"
import { handleError } from "../../../utils.ts"
import { uploadImage } from "../../../utils/uploadImage.ts"

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
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => EmployeeService.readEmployeeById({ userId }),
    enabled: !!userId,
  })

  const {
    formState: { isSubmitting },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      fullName: currentUser?.fullName,
      email: currentUser?.email,
      avatar: currentUser?.avatar,
    },
  })

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentUser?.isSuperUser) {
        throw new Error("Permission denied")
      }

      const url = await uploadImage(file)

      await EmployeeService.updateEmployeeById({
        id: userId,
        requestBody: {
          avatar: url,

        },
      })
      console.log("Sending PATCH", { id: userId, avatar: url })



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

    if (!currentUser?.isSuperUser) {
      showToast("Permission denied", "Only superusers can update avatar", "error")
      return
    }

    const selectedFile = event.target.files[0]
    const newFile = {
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
    }

    setFile(newFile)
    avatarMutation.mutate(selectedFile)
  }

  function handleFileButtonClick() {
    if (currentUser?.isSuperUser && fileInputRef.current) {
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
                    disabled={isSubmitting}
                />

                <Box
                    w="100px"
                    h="100px"
                    borderRadius="full"
                    overflow="hidden"
                    cursor={currentUser?.isSuperUser ? "pointer" : "not-allowed"}
                    border="2px solid"
                    borderColor="gray.200"
                    _hover={{ opacity: currentUser?.isSuperUser ? 0.8 : 1 }}
                    onClick={handleFileButtonClick}
                >
                  <img
                      src={
                          file?.preview ??
                          user?.avatar ??
                          "https://via.placeholder.com/100x100?text=Avatar"
                      }
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              </FormControl>
            </Section>
          </Box>
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
