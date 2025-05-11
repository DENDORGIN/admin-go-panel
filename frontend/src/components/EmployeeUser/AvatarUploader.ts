import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EmployeeService, type ApiError } from "../../client"
import { uploadImage } from "../../utils/uploadImage"
import { handleError } from "../../utils"
import useCustomToast from "../../hooks/useCustomToast"

export function useAvatarUpload(userId: string, isSuperUser: boolean) {
    const queryClient = useQueryClient()
    const showToast = useCustomToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<{ file: File; preview: string } | null>(null)

    const mutation = useMutation({
        mutationFn: async (file: File) => {
            if (!isSuperUser) throw new Error("Permission denied")
            const url = await uploadImage(file)
            if (!url) throw new Error("Upload failed")
            await EmployeeService.updateEmployeeById({
                id: userId,
                requestBody: { avatar: url },
            })
            return url
        },
        onSuccess: () => {
            showToast("Success!", "Avatar updated", "success")
            queryClient.invalidateQueries({ queryKey: ["user", userId] })
        },
        onError: (err: ApiError | Error) => {
            if (err instanceof Error && err.message === "Permission denied") {
                showToast("Permission denied", "Only superusers can update avatar", "error")
                return
            }
            "status" in err
                ? handleError(err as ApiError, showToast)
                : showToast("Error", err.message || "Unknown error", "error")
        },
    })

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return
        if (!isSuperUser) {
            showToast("Permission denied", "Only superusers can update avatar", "error")
            return
        }
        const selectedFile = event.target.files[0]
        const newFile = {
            file: selectedFile,
            preview: URL.createObjectURL(selectedFile),
        }
        setFile(newFile)
        mutation.mutate(selectedFile)
    }

    const handleFileButtonClick = () => {
        if (isSuperUser && fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    return {
        fileInputRef,
        file,
        onFileChange,
        handleFileButtonClick,
        isUploading: mutation.isPending,
    }
}
