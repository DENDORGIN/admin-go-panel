import {
    Box,
    Input,
    FormControl,
} from "@chakra-ui/react"

interface Props {
    fileInputRef: React.RefObject<HTMLInputElement>
    avatarSrc: string
    isUploading: boolean
    isSuperUser: boolean
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClick: () => void
}

export default function UserAvatar({
                                       fileInputRef,
                                       avatarSrc,
                                       isUploading,
                                       isSuperUser,
                                       onFileChange,
                                       onClick,
                                   }: Props) {
    return (
        <FormControl mt={4}>
            <Input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                hidden
                disabled={isUploading}
            />
            <Box
                w="100px"
                h="100px"
                borderRadius="full"
                overflow="hidden"
                cursor={isSuperUser ? "pointer" : "not-allowed"}
                border="2px solid"
                borderColor="gray.200"
                _hover={{ opacity: isSuperUser ? 0.8 : 1 }}
                onClick={onClick}
            >
                <img
                    src={avatarSrc}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </Box>
        </FormControl>
    )
}