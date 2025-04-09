import {
    Box,
    Button,
    Flex,
    Input,
    Table,
    Tbody,
    Td,
    Tr,
} from "@chakra-ui/react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ApiError, PropertyService} from "../../client"
import { handleError } from "../../utils";
import useCustomToast from "../../hooks/useCustomToast";
import {EditIcon} from "@chakra-ui/icons";

type EditablePropertiesProps = {
    propertyId: string
    property: Record<string, string>
    onSuccess?: () => void
    onError?: (err: ApiError) => void
}





const EditableProperties = ({ propertyId, property, onSuccess, onError }: EditablePropertiesProps) => {
    const [isEditing, setIsEditing] = useState(false)

    const getEditableProps = (props: Record<string, string>) => {
        return Object.fromEntries(
            Object.entries(props).filter(([key]) => key !== "ID" && key !== "content_id")
        )
    }

    const [editedProps, setEditedProps] = useState<Record<string, string>>(
        getEditableProps(property)
    )

    const showToast = useCustomToast()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (data: Record<string, string>) =>
            PropertyService.UpdateProperties(propertyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["property", propertyId] })
            setIsEditing(false)
            onSuccess?.()
            showToast("Success!", "Update property", "success")
        },
        onError: (err) => {
            if (
                typeof err === "object" &&
                err !== null &&
                "status" in err &&
                "body" in err
            ) {
                handleError(err as ApiError, showToast)
                onError?.(err as ApiError)
            } else {
                showToast("Error", "Somthing wrong", "error")
            }
        }
    })

    const handleChange = (key: string, value: string) => {
        setEditedProps((prev) => ({ ...prev, [key]: value }))
    }

    const handleCancel = () => {
        setEditedProps(getEditableProps(property))
        setIsEditing(false)
    }

    const handleSave = () => {
        mutation.mutate(editedProps)
    }

    return (
        <Box mt={4}>
            <Flex justify="space-between" align="center" mb={2}>
                <strong>Property:</strong>
                {isEditing ? (
                    <Flex gap={2}>
                        <Button size="sm" variant="primary" onClick={handleSave} isLoading={mutation.isPending}>
                            Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </Flex>
                ) : (
                    <Button size="sm" color="orange.500" onClick={() => setIsEditing(true)}>
                        <EditIcon />
                    </Button>
                )}
            </Flex>

            <Table size="sm" variant="simple">
                <Tbody>
                    {Object.entries(editedProps).map(([key, value]) => (
                        <Tr key={key}>
                            <Td fontWeight="semibold" w="40%">
                                {key}
                            </Td>
                            <Td>
                                {isEditing ? (
                                    <Input
                                        size="sm"
                                        value={value}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                    />
                                ) : (
                                    value
                                )}
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    )
}

export default EditableProperties