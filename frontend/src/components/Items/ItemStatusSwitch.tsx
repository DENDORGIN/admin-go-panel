

import { Flex, Switch, Text, Box } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { ItemsService, type ItemPublic, type ApiError } from "../../client"
import { handleError } from "../../utils"
import useCustomToast from "../../hooks/useCustomToast";

interface Props {
    item: ItemPublic
    onUpdated: () => void
}

const ItemStatusSwitch = ({ item, onUpdated }: Props) => {
    const showToast = useCustomToast()

    const mutation = useMutation({
        mutationFn: (status: boolean) => ItemsService.updateItem(item.ID, { status }),
        onSuccess: () => {
            showToast("Success", "Status updated", "success")
            onUpdated()
        },
        onError: (err: ApiError) => {
            handleError(err, showToast)
        },
    })

    return (
        <Box>
            <Text fontWeight="bold" mb={1}>Status:</Text>
            <Flex align="center" gap={2}>
                <Box
                    w="15px"
                    h="15px"
                    borderRadius="full"
                    bg={item.status ? "green.500" : "red.500"}
                />
                <Switch
                    isChecked={item.status}
                    onChange={(e) => mutation.mutate(e.target.checked)}
                    colorScheme="teal"
                    size="md"
                />
                <Text>{item.status ? "Active" : "Inactive"}</Text>
            </Flex>
        </Box>
    )
}

export default ItemStatusSwitch
