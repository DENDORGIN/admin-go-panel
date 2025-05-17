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
    onChange: (key: keyof EditableUserFields, value: string) => void
    onSave: () => void
    onCancel: () => void
    isSaving: boolean
    user: Partial<EditableUserFields>
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
                    <Text><strong>Condition Type:</strong> {user.condition_type ?? "-"}</Text>
                    <Text><strong>Salary:</strong> {user.salary ?? "-"}</Text>
                    <Text><strong>Start Date:</strong> {formatDateTime(user.date_start)}</Text>
                    <Text><strong>End Date:</strong> {formatDateTime(user.date_end)}</Text>
                </>
            ) : (
                <Stack spacing={3} mt={4}>
                    <FormInput label="Company" value={editedUser.company || ""} onChange={(e) => onChange("company", e.target.value)} />
                    <FormInput label="Position" value={editedUser.position || ""} onChange={(e) => onChange("position", e.target.value)} />
                    <FormInput label="Condition Type" value={editedUser.condition_type || ""} onChange={(e) => onChange("condition_type", e.target.value)} />
                    <FormInput label="Salary" value={editedUser.salary || ""} onChange={(e) => onChange("salary", e.target.value)} />
                    <FormInput label="Start Date" value={editedUser.date_start || ""} onChange={(e) => onChange("date_start", e.target.value)} />
                    <FormInput label="End Date" value={editedUser.date_end || ""} onChange={(e) => onChange("date_end", e.target.value)} />
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

function formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
