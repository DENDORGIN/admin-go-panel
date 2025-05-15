import {
    Button,
    Flex,
    IconButton,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react"
import { EditIcon } from "@chakra-ui/icons"
import { EditableUserFields } from "./useUpdateUser"

interface Props {
    isEditing: boolean
    setIsEditing: (val: boolean) => void
    editedUser: EditableUserFields
    setEditedUser: (fields: EditableUserFields) => void
    onChange: (key: keyof EditableUserFields, value: string) => void
    onSave: () => void
    onCancel: () => void
    isSaving: boolean
    user: {
        fullName?: string | null
        acronym?: string | null
        email: string
        phone_number_1?: string | null
        phone_number_2?: string | null
        address?: string | null
    }
}

export default function UserForm({
                                     isEditing,
                                     setIsEditing,
                                     editedUser,
                                     onChange,
                                     onSave,
                                     onCancel,
                                     isSaving,
                                     user,
                                 }: Props) {
    return (
        <>
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
                            variant="primary"
                            onClick={onSave}
                            isLoading={isSaving}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </Flex>
                )}
            </Flex>

            {!isEditing ? (
                <>
                    <Text><strong>Full name:</strong> {user.fullName ?? "-"}</Text>
                    <Text><strong>Acronym:</strong> {user.acronym ?? "-"}</Text>
                    <Text><strong>Email:</strong> {user.email}</Text>
                    <Text><strong>Phone 1:</strong> {user.phone_number_1 ?? "-"}</Text>
                    <Text><strong>Phone 2:</strong> {user.phone_number_2 ?? "-"}</Text>
                    <Text><strong>Address:</strong> {user.address ?? "-"}</Text>
                </>
            ) : (
                <Stack spacing={3} mt={4}>
                    <FormInput
                        label="Full name"
                        value={editedUser.fullName || ""}
                        onChange={(e) => onChange("fullName", e.target.value)}
                    />
                    <FormInput
                        label="Acronym"
                        value={editedUser.acronym || ""}
                        onChange={(e) => onChange("acronym", e.target.value)}
                    />
                    <FormInput
                        label="Email"
                        value={editedUser.email || ""}
                        onChange={(e) => onChange("email", e.target.value)}
                    />
                    <FormInput
                        label="Phone 1"
                        value={editedUser.phone_number_1 || ""}
                        onChange={(e) => onChange("phone_number_1", e.target.value)}
                    />
                    <FormInput
                        label="Phone 2"
                        value={editedUser.phone_number_2 || ""}
                        onChange={(e) => onChange("phone_number_2", e.target.value)}
                    />
                    <FormInput
                        label="Address"
                        value={editedUser.address || ""}
                        onChange={(e) => onChange("address", e.target.value)}
                    />
                </Stack>
            )}
        </>
    )
}

function FormInput({
                       label,
                       value,
                       onChange,
                   }: {
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <Flex direction="column">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
                {label}
            </Text>
            <Input placeholder={label} value={value} onChange={onChange} />
        </Flex>
    )
}
