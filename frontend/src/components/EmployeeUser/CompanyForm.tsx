import {
    Button,
    Flex,
    IconButton,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react"
import { EditIcon, AddIcon, CloseIcon } from "@chakra-ui/icons"
import { EditableUserFields } from "./useUpdateUser"
import { useState } from "react"

interface Props {
    isEditing: boolean
    setIsEditing: (val: boolean) => void
    editedUser: EditableUserFields
    onChange: (key: keyof EditableUserFields, value: string) => void
    onSave: () => void
    onCancel: () => void
    isSaving: boolean
    user: Partial<EditableUserFields & {
        created_at: string
        updated_at: string
        whu_created_by_acron: string
        whu_updated_by_acron: string | null
        extra_data: Record<string, string>
    }>
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
    const [extraData, setExtraData] = useState<Record<string, string>>(user.extra_data || {})

    const handleExtraChange = (key: string, value: string) => {
        setExtraData((prev) => ({ ...prev, [key]: value }))
    }

    const handleAddExtra = () => {
        if (Object.keys(extraData).length >= 10) return
        const newKey = `key${Object.keys(extraData).length + 1}`
        setExtraData((prev) => ({ ...prev, [newKey]: "" }))
    }

    const handleRemoveExtra = (keyToRemove: string) => {
        setExtraData((prev) => {
            const newData = { ...prev }
            delete newData[keyToRemove]
            return newData
        })
    }

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
                    <Text><strong>Created at:</strong> {formatDateTime(user.created_at)}</Text>
                    <Text><strong>Updated at:</strong> {formatDateTime(user.updated_at)}</Text>
                    <Text><strong>Created by:</strong> {user.whu_created_by_acron ?? "-"}</Text>
                    <Text><strong>Updated by:</strong> {user.whu_updated_by_acron ?? "-"}</Text>
                    <Text fontWeight="medium"><strong>Extra data:</strong></Text>
                    {user.extra_data && typeof user.extra_data === "object" ? (
                        <Stack pl={4} spacing={1}>
                            {Object.entries(user.extra_data).map(([key, value]) => (
                                <Text key={key}>
                                    <strong>{key}:</strong> {String(value)}
                                </Text>
                            ))}
                        </Stack>
                    ) : (
                        <Text pl={4}>-</Text>
                    )}
                </>
            ) : (
                <Stack spacing={3} mt={4}>
                    <FormInput label="Company" value={editedUser.company || ""} onChange={(e) => onChange("company", e.target.value)} />
                    <FormInput label="Position" value={editedUser.position || ""} onChange={(e) => onChange("position", e.target.value)} />
                    <FormInput label="Condition Type" value={editedUser.condition_type || ""} onChange={(e) => onChange("condition_type", e.target.value)} />
                    <FormInput label="Salary" value={editedUser.salary || ""} onChange={(e) => onChange("salary", e.target.value)} />
                    <FormInput label="Start Date" value={editedUser.date_start || ""} onChange={(e) => onChange("date_start", e.target.value)} />
                    <FormInput label="End Date" value={editedUser.date_end || ""} onChange={(e) => onChange("date_end", e.target.value)} />

                    <Text fontWeight="medium">Extra data</Text>

                    {Object.entries(extraData).map(([key, value]) => (
                        <Flex key={key} gap={2} align="center">
                            <Input value={key} isReadOnly flex={1} />
                            <Input
                                placeholder="Value"
                                value={value}
                                onChange={(e) => handleExtraChange(key, e.target.value)}
                                flex={2}
                            />
                            <IconButton
                                aria-label="Remove field"
                                icon={<CloseIcon />}
                                size="sm"
                                onClick={() => handleRemoveExtra(key)}
                            />
                        </Flex>
                    ))}

                    <Button
                        onClick={handleAddExtra}
                        leftIcon={<AddIcon />}
                        size="sm"
                        variant="outline"
                        isDisabled={Object.keys(extraData).length >= 10}
                    >
                        Add extra field
                    </Button>
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

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}