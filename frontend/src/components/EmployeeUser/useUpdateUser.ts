import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EmployeeService, type ApiError } from "../../client"
import { handleError} from "../../utils.ts";
import { useParams } from "@tanstack/react-router"
import useCustomToast from "../../hooks/useCustomToast.ts";

export type EditableUserFields = Partial<{
    fullName: string
    email: string
    phone_number_1: string
    phone_number_2: string
    address: string
    acronym: string
}>

export function useUpdateUser() {
    const { userId } = useParams({ from: "/_layout/user/$userId" })
    const showToast = useCustomToast()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: EditableUserFields) =>
            EmployeeService.updateEmployeeById({
                id: userId,
                requestBody: data as any,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] })
            showToast("Success!", "User info updated", "success")
        },
        onError: (err) => {
            handleError(err as ApiError, showToast)
        },
    })
}
