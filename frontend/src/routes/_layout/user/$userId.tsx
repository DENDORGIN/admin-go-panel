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
import { USER_INFO_FIELDS, COMPANY_INFO_FIELDS } from "../../../components/EmployeeUser/userFieldGroups"
import { useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import useAuth from "../../../hooks/useAuth.ts"
import { useUpdateUser, EditableUserFields } from "../../../components/EmployeeUser/useUpdateUser.ts"
import { useAvatarUpload } from "../../../components/EmployeeUser/AvatarUploader.ts"
import UserAvatar from "../../../components/EmployeeUser/UserAvatar.tsx"
import UserForm from "../../../components/EmployeeUser/UserForm.tsx"
import CompanyForm from "../../../components/EmployeeUser/CompanyForm.tsx"

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
  })

  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false)
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  const [editedUser, setEditedUser] = useState<EditableUserFields>({})

  useEffect(() => {
    if (user) {
      setEditedUser({
        fullName: user.fullName ?? undefined,
        acronym: user.acronym ?? undefined,
        email: user.email,
        phone_number_1: user.phone_number_1 ?? undefined,
        phone_number_2: user.phone_number_2 ?? undefined,
        address: user.address ?? undefined,
        company: user.company ?? undefined,
        position: user.position ?? undefined,
        condition_type: user.condition_type ?? undefined,
        salary: user.salary ?? undefined,
        date_start: user.date_start ?? undefined,
        date_end: user.date_end ?? undefined,
      })
    }
  }, [user])

  const handleEditChange = (key: keyof EditableUserFields, value: string) => {
    setEditedUser((prev) => ({ ...prev, [key]: value }))
  }

  const saveFields = (fields: (keyof EditableUserFields)[], done: () => void) => {
    if (!user) return

    const updatedFields: Partial<EditableUserFields> = {}

    fields.forEach((key) => {
      const originalValue = user[key]
      const editedValue = editedUser[key]

      if (
          typeof originalValue === "string" &&
          typeof editedValue === "string" &&
          originalValue !== editedValue
      ) {
        (updatedFields as Record<string, string>)[key] = editedValue
      }
    })

    updateMutation.mutate(updatedFields)
    done()
  }

  const handleSaveUserInfo = () => {
    saveFields(USER_INFO_FIELDS, () => setIsEditingUserInfo(false))
  }

  const handleSaveCompanyInfo = () => {
    saveFields(COMPANY_INFO_FIELDS, () => setIsEditingCompanyInfo(false))
  }

  const handleCancelUserInfo = () => {
    if (!user) return
    setEditedUser((prev) => ({
      ...prev,
      fullName: user.fullName ?? undefined,
      acronym: user.acronym ?? undefined,
      email: user.email,
      phone_number_1: user.phone_number_1 ?? undefined,
      phone_number_2: user.phone_number_2 ?? undefined,
      address: user.address ?? undefined,
    }))
    setIsEditingUserInfo(false)
  }

  const handleCancelCompanyInfo = () => {
    if (!user) return
    setEditedUser((prev) => ({
      ...prev,
      company: user.company ?? undefined,
      position: user.position ?? undefined,
      condition_type: user.condition_type ?? undefined,
      salary: user.salary ?? undefined,
      date_start: user.date_start ?? undefined,
      date_end: user.date_end ?? undefined,
    }))
    setIsEditingCompanyInfo(false)
  }

  if (isLoading) {
    return (
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" />
        </Flex>
    )
  }

  if (!user || error) {
    return <Text textAlign="center">User not found or an error occurred.</Text>
  }

  const avatarSrc = file?.preview || user.avatar || "https://via.placeholder.com/100x100?text=Avatar"

  const getCompanyEditableFields = (user: UserEmployeePublic) => ({
    company: user.company ?? undefined,
    position: user.position ?? undefined,
    condition_type: user.condition_type ?? undefined,
    salary: user.salary ?? undefined,
    date_start: user.date_start ?? undefined,
    date_end: user.date_end ?? undefined,
    created_at: user.created_at,
    updated_at: user.updated_at,
    whu_created_by_acron: user.whu_created_by_acron,
    extra_data: typeof user.extra_data === "object" && user.extra_data !== null
        ? Object.fromEntries(
            Object.entries(user.extra_data).filter(
                ([_, value]) => typeof value === "string"
            )
        ) as Record<string, string>
        : {},

  })

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
                isEditing={isEditingUserInfo}
                setIsEditing={setIsEditingUserInfo}
                editedUser={editedUser}
                setEditedUser={setEditedUser}
                onChange={handleEditChange}
                onSave={handleSaveUserInfo}
                onCancel={handleCancelUserInfo}
                isSaving={updateMutation.isPending}
                user={user}
            />
          </Section>

          <Section title="Company Information">
            <CompanyForm
                isEditing={isEditingCompanyInfo}
                setIsEditing={setIsEditingCompanyInfo}
                editedUser={editedUser}
                onChange={handleEditChange}
                onSave={handleSaveCompanyInfo}
                onCancel={handleCancelCompanyInfo}
                isSaving={updateMutation.isPending}
                user={getCompanyEditableFields(user)}
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