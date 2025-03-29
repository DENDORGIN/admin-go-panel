import {
    HStack,
    Button,
    Image,
    Textarea,
    useColorModeValue,
    useDisclosure
} from "@chakra-ui/react";
import { AttachmentIcon } from "@chakra-ui/icons";
import { useRef, useEffect } from "react";



import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

import { Popover, PopoverTrigger, PopoverContent, IconButton } from "@chakra-ui/react";
import { FaSmile } from "react-icons/fa";


interface InputBarProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    fileInputId?: string;
    iconSrc: string;
}

const InputBar: React.FC<InputBarProps> = ({
                                               value,
                                               onChange,
                                               onSend,
                                               onFileSelect,
                                               disabled = false,
                                               fileInputId = "file-upload",
                                               iconSrc,
                                           }) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const inputBg = useColorModeValue("#FFFFFF", "#1A202C");
    const inputColor = useColorModeValue("black", "white");
    const { isOpen, onOpen, onClose } = useDisclosure();


    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [value]);

    return (
        <HStack
            mt={4}
            p={2}
            // borderTop="1px solid"
            borderColor={useColorModeValue("gray.300", "gray.600")}
            bg={inputBg}
            w="100%"
            borderRadius="md"
            alignItems="flex-end"
        >
            <Button
                as="label"
                htmlFor={fileInputId}
                variant="ghost"
                _hover={{ transform: "scale(1.1)" }}
                _active={{ transform: "scale(0.95)" }}
                transition="all 0.1s ease-in-out"
                cursor="pointer"
                p={2}
            >
                <AttachmentIcon color="teal.400" boxSize="20px" />
            </Button>
            <input type="file" id={fileInputId} hidden onChange={onFileSelect} multiple />

            <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
                <PopoverTrigger>
                    <IconButton
                        aria-label="Emoji picker"
                        icon={<FaSmile />}
                        variant="ghost"
                        size="sm"
                        onClick={onOpen}
                    />
                </PopoverTrigger>
                <PopoverContent zIndex={10}>
                    <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) => {
                            onChange(value + emoji.native);
                            onClose();
                        }}
                    />
                </PopoverContent>
            </Popover>



            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Send message..."
                resize="none"
                minH="20px"
                maxH="200px"
                isDisabled={disabled}
                border="none"
                borderBottom="2px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
                focusBorderColor="teal.400"
                borderRadius="0"
                px="0"
                py="0"
                fontSize="sm"
                lineHeight="1"
                _placeholder={{ color: useColorModeValue("gray.500", "gray.400") }}
                _focus={{
                    outline: "none",
                    borderColor: "teal.400",
                    boxShadow: "none",
                }}
                bg="transparent"
                color={inputColor}
                overflow="hidden"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                        if (textareaRef.current) textareaRef.current.style.height = "auto";
                    }
                }}
            />

            <Button
                onClick={onSend}
                leftIcon={<Image src={iconSrc} boxSize="20px" />}
                variant="ghost"
                isDisabled={disabled}
                _hover={{ transform: "scale(1.1)" }}
                _active={{ transform: "scale(0.95)" }}
                transition="all 0.1s ease-in-out"
                cursor="pointer"
                p={2}
            />
        </HStack>
    );
};

export default InputBar;