import {
    Box,
    Button,
    Flex,
    IconButton,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react"
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons"
import { FC, useState } from "react"

type Props = {
    extraData?: Record<string, string>
    onChange: (data: Record<string, string>) => void
}

const ExtraDataForm: FC<Props> = ({ extraData = {}, onChange }) => {
    const [isEditing, setIsEditing] = useState(false)

    const entries = Object.entries(extraData).length
        ? Object.entries(extraData)
        : [["", ""]]

    const handleChange = (index: number, key: string, value: string) => {
        const updated = [...entries]
        updated[index] = [key, value]
        onChange(Object.fromEntries(updated.filter(([k]) => k.trim())))
    }

    const handleAdd = () => {
        onChange({ ...extraData, "": "" })
    }

    const handleRemove = (index: number) => {
        const updated = entries.filter((_, i) => i !== index)
        onChange(Object.fromEntries(updated))
    }

    const handleCancel = () => {
        setIsEditing(false)
    }

    const handleSave = () => {
        setIsEditing(false)
    }

    return (
        <>
            <Flex justify="flex-end" align="center" mb={2}>
                {!isEditing ? (
                    <IconButton
                        icon={<EditIcon />}
                        aria-label="Edit"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    />
                ) : (
                    <Flex gap={2}>
                        <Button size="sm" variant="primary" onClick={handleSave}>
                            Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </Flex>
                )}
            </Flex>

            {!isEditing ? (
                <Stack spacing={1}>
                    {entries.length > 0 ? (
                        entries.map(([key, value], index) => (
                            <Flex key={index} gap={2}>
                                <Text fontWeight="medium">{key}:</Text>
                                <Text>{value}</Text>
                            </Flex>
                        ))
                    ) : (
                        <Text color="gray.500">No extra data</Text>
                    )}
                </Stack>
            ) : (
                <Stack spacing={3}>
                    {entries.map(([key, value], index) => (
                        <Flex key={index} gap={2}>
                            <Input
                                placeholder="Key"
                                value={key}
                                onChange={(e) => handleChange(index, e.target.value, value)}
                            />
                            <Input
                                placeholder="Value"
                                value={value}
                                onChange={(e) => handleChange(index, key, e.target.value)}
                            />
                            <IconButton
                                aria-label="Delete"
                                icon={<DeleteIcon />}
                                size="sm"
                                onClick={() => handleRemove(index)}
                            />
                        </Flex>
                    ))}
                    <Box>
                        <Button size="sm" onClick={handleAdd} leftIcon={<AddIcon />}>
                            Add field
                        </Button>
                    </Box>
                </Stack>
            )}
        </>
    )
}

export default ExtraDataForm
