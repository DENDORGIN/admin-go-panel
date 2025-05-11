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
        company: string | null
        position: string | null
        condition_type: string | null
        salary: string | null
        date_start: string | null
        date_end: string | null
        created_at: string
        updated_at: string
        whu_created_by_acron: string
        whu_updated_by_acron: string | null
        extra_data: JSON
    }
}

export default function CompanyForm({
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
                    <Text><strong>Company:</strong> {user.company ?? "-"}</Text>
                    <Text><strong>Position:</strong> {user.position ?? "-"}</Text>
                    <Text><strong>Condition type:</strong> {user.condition_type ?? "-"}</Text>
                    <Text><strong>Salary:</strong> {user.salary ?? "-"}</Text>
                    <Text><strong>Date start:</strong> {user.date_start ?? "-"}</Text>
                    <Text><strong>Date end:</strong> {user.date_end ?? "-"}</Text>
                    <Text><strong>Created at:</strong> {user.created_at}</Text>
                    <Text><strong>Updated at:</strong> {user.updated_at}</Text>
                    <Text><strong>Who created:</strong> {user.whu_created_by_acron}</Text>
                    <Text><strong>Updated at:</strong> {user.whu_updated_by_acron}</Text>
                </>
            ) : (
                <Stack spacing={3} mt={4}>
                    <Input
                        placeholder="Company"
                        value={editedUser.company || ""}
                        onChange={(e) => onChange("company", e.target.value)}
                    />
                    <Input
                        placeholder="Position"
                        value={editedUser.position || ""}
                        onChange={(e) => onChange("position", e.target.value)}
                    />
                    <Input
                        placeholder="Condition type"
                        value={editedUser.condition_type || ""}
                        onChange={(e) => onChange("condition_type", e.target.value)}
                    />
                    <Input
                        placeholder="Salary"
                        value={editedUser.salary || ""}
                        onChange={(e) => onChange("salary", e.target.value)}
                    />
                    <Input
                        placeholder="Date start"
                        value={editedUser.date_start || ""}
                        onChange={(e) => onChange("date_start", e.target.value)}
                    />
                    <Input
                        placeholder="Date end"
                        value={editedUser.date_end || ""}
                        onChange={(e) => onChange("date_end", e.target.value)}
                    />
                </Stack>
            )}
        </>
    )
}
