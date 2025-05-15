import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EmployeeService, type ApiError } from "../../client"
import { handleError } from "../../utils.ts"
import { useParams } from "@tanstack/react-router"
import useCustomToast from "../../hooks/useCustomToast.ts"


type BasicEditableFields = {
    fullName?: string
    email?: string
    phone_number_1?: string
    phone_number_2?: string
    address?: string
    acronym?: string
}


type ExtendedEditableFields = {
    company?: string
    position?: string
    condition_type?: string
    salary?: string
    date_start?: string | null
    date_end?: string | null
    extra_data?: Record<string, string>
}


export type EditableUserFields = Partial<BasicEditableFields & ExtendedEditableFields>

export function useUpdateUser() {
    const { userId } = useParams({ from: "/_layout/user/$userId" })
    const showToast = useCustomToast()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: Partial<EditableUserFields>) =>
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
