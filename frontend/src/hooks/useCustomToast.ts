import { useToast } from "@chakra-ui/react"
import { useCallback } from "react"

const useCustomToast = () => {
  const toast = useToast()

  return useCallback(
    (title: string, description: string, status: "success" | "error") => {
      toast({
        title,
        description,
        status,
        isClosable: true,
        position: "bottom-right",
      })
    },
    [toast],
  )
}

export default useCustomToast
