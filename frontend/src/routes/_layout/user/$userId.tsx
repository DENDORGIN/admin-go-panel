import {
  Container,
  Flex,
  Link,
  Spinner,
  Text,
  Box,
  Divider,
  Stack,
} from "@chakra-ui/react"
import { ArrowBackIcon } from "@chakra-ui/icons"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  type UserEmployeePublic,
  EmployeeService,
} from "../../../client"
import { useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import useAuth from "../../../hooks/useAuth.ts"
import { useUpdateUser, EditableUserFields } from "../../../components/EmployeeUser/useUpdateUser.ts"
import { useAvatarUpload} from "../../../components/EmployeeUser/AvatarUploader.ts";
import UserAvatar from "../../../components/EmployeeUser/UserAvatar.tsx"
import UserForm from "../../../components/EmployeeUser/UserForm.tsx"

export const Route = createFileRoute("/_layout/user/$userId")({
  component: UserDetails,
})

function UserDetails() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const isSuperUser = !!currentUser?.isSuperUser
  const updateMutation = useUpdateUser()

  const {
    file,
    fileInputRef,
    onFileChange,
    handleFileButtonClick,
    isUploading,
  } = useAvatarUpload(userId, isSuperUser)

  const { data: user, isLoading, error } = useQuery<UserEmployeePublic>({
    queryKey: ["user", userId],
    queryFn: () => EmployeeService.readEmployeeById({ userId }),
    enabled: !!userId,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<EditableUserFields>({})

  useEffect(() => {
    if (user) {
      setEditedUser({
        fullName: user.fullName ?? "",
        acronym: user.acronym ?? "",
        email: user.email,
        phone_number_1: user.phone_number_1 ?? "",
        phone_number_2: user.phone_number_2 ?? "",
        address: user.address ?? "",
      })
    }
  }, [user])

  const handleEditChange = (key: keyof EditableUserFields, value: string) => {
    setEditedUser((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updateMutation.mutate(editedUser)
    setIsEditing(false)
  }

  const handleCancel = () => {
    if (!user) return
    setEditedUser({
      fullName: user.fullName ?? "",
      acronym: user.acronym ?? "",
      email: user.email,
      phone_number_1: user.phone_number_1 ?? "",
      phone_number_2: user.phone_number_2 ?? "",
      address: user.address ?? "",
    })
    setIsEditing(false)
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

  const avatarSrc = file?.preview || user.avatar || "https://via.placeholder.com/100x100?text=Avatar"

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
          <Section title="Avatar">
            <UserAvatar
                fileInputRef={fileInputRef}
                avatarSrc={avatarSrc}
                isUploading={isUploading}
                isSuperUser={isSuperUser}
                onFileChange={onFileChange}
                onClick={handleFileButtonClick}
            />
          </Section>

          <Section title="User Information">
            <UserForm
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                editedUser={editedUser}
                setEditedUser={setEditedUser}
                onChange={handleEditChange}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={updateMutation.isPending}
                user={user}
            />
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
