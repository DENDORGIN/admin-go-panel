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
import { FC, useEffect, useState } from "react"

type Props = {
    extraData?: Record<string, string | string[]>
    onChange: (data: Record<string, string | string[]>) => void
}

const ExtraDataForm: FC<Props> = ({ extraData = {}, onChange }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [localEntries, setLocalEntries] = useState<[string, string][]>([])

    // Синхронізація з extraData
    useEffect(() => {
        const entries = Object.entries(extraData).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join(", ") : v,
        ]) as [string, string][]
        setLocalEntries(entries)
    }, [extraData])

    const handleChange = (index: number, key: string, value: string) => {
        const updated = [...localEntries]
        updated[index] = [key, value]
        setLocalEntries(updated)
    }

    const handleAdd = () => {
        if (localEntries.length >= 10) return
        setLocalEntries([...localEntries, ["", ""]])
    }

    const handleRemove = (index: number) => {
        setLocalEntries(localEntries.filter((_, i) => i !== index))
    }

    const handleCancel = () => {
        setIsEditing(false)
        const entries = Object.entries(extraData).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join(", ") : v,
        ]) as [string, string][]
        setLocalEntries(entries)
    }

    const handleSave = () => {
        const cleaned = localEntries.filter(([k]) => k.trim())
        const parsed = Object.fromEntries(
            cleaned.map(([k, v]) => [
                k,
                v.includes(",") ? v.split(",").map((s) => s.trim()) : v.trim(),
            ])
        )
        onChange(parsed)
        setIsEditing(false)
    }

    const entries = isEditing
        ? localEntries
        : (Object.entries(extraData).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join(", ") : v,
        ]) as [string, string][])

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
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            leftIcon={<AddIcon />}
                            isDisabled={localEntries.length >= 10}
                        >
                            Add field
                        </Button>
                    </Box>
                </Stack>
            )}
        </>
    )
}

export default ExtraDataForm
