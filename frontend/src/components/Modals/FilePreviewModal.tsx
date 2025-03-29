import React from "react";
import {
    Box,
    Button,
    IconButton,
    Image,
    Input,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text, Tooltip
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

interface FilePreview {
    name: string;
    size: string;
    preview: string;
    file: File;
}

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: FilePreview[];
    onRemove: (index: number) => void;
    onUpload: () => void;
    message: string;
    onMessageChange: (value: string) => void;
    isDisabled?: boolean;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               files,
                                                               onRemove,
                                                               onUpload,
                                                               message,
                                                               onMessageChange,
                                                               isDisabled
                                                           }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Preview files</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <List spacing={3} mb={4}>
                        {files.map((file, index) => (
                            <ListItem
                                key={index}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Image
                                    src={file.preview}
                                    alt={file.name}
                                    boxSize="50px"
                                    objectFit="cover"
                                    borderRadius="md"
                                />
                                <Box flex="1" mx={4}>
                                    <Text fontWeight="bold">{file.name}</Text>
                                    <Text fontSize="sm" color="gray.500">
                                        {file.size}
                                    </Text>
                                </Box>
                                <IconButton
                                    icon={<CloseIcon />}
                                    aria-label="Remove file"
                                    size="sm"
                                    onClick={() => onRemove(index)}
                                />
                            </ListItem>
                        ))}
                    </List>

                    <Input
                        placeholder="Add message..."
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                    />
                </ModalBody>
                <ModalFooter>
                    <Box mr={3}>
                        <Tooltip
                            label={
                                isDisabled
                                    ? "Неможливо завантажити: кімната закрита або ви не власник каналу"
                                    : ""
                            }
                            isDisabled={!isDisabled}
                            hasArrow
                            placement="top"
                        >
                            <Button
                                onClick={onUpload}
                                colorScheme="teal"
                                variant="outline"
                                isDisabled={isDisabled}
                                cursor={isDisabled ? "not-allowed" : "pointer"}
                            >
                                Download
                            </Button>
                        </Tooltip>
                    </Box>
                    <Button onClick={onClose} variant="outline">Cancel</Button>
                </ModalFooter>

            </ModalContent>
        </Modal>
    );
};

export default FilePreviewModal;
