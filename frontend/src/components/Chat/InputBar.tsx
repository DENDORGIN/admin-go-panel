import {
    HStack,
    Button,
    Image,
    Textarea,
    useColorModeValue,
    useDisclosure,
    Flex
} from "@chakra-ui/react";
import { AttachmentIcon } from "@chakra-ui/icons";
import { useRef, useEffect, forwardRef } from "react";
import React from "react"

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

const InputBar = forwardRef<HTMLTextAreaElement, InputBarProps>(({
                                                                     value,
                                                                     onChange,
                                                                     onSend,
                                                                     onFileSelect,
                                                                     disabled = false,
                                                                     fileInputId = "file-upload",
                                                                     iconSrc,
                                                                 }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const inputBg = useColorModeValue("#FFFFFF", "#1A202C");
    const inputColor = useColorModeValue("black", "white");
    const { isOpen, onOpen, onClose } = useDisclosure();


    useEffect(() => {
        const textarea = (ref as React.RefObject<HTMLTextAreaElement>)?.current ?? internalRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        }
    }, [value]);

    return (
        <HStack
            mt={2}
            p={0}
            borderColor={useColorModeValue("gray.300", "gray.600")}
            bg={inputBg}
            w="100%"
            borderRadius="md"
            alignItems="flex-end"
        >
            <HStack spacing={0}>
                <Button
                    as="label"
                    htmlFor={fileInputId}
                    variant="ghost"
                    _hover={{ transform: "scale(1.05)" }}
                    _active={{ transform: "scale(0.95)" }}
                    transition="all 0.1s ease-in-out"
                    cursor="pointer"
                    p={1}
                    minW="auto"
                    borderRadius="md"
                >
                    <AttachmentIcon color="teal.400" boxSize="20px" />
                </Button>
                <input type="file" id={fileInputId} hidden onChange={onFileSelect} multiple />

                <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
                    <PopoverTrigger>
                        <IconButton
                            aria-label="Emoji picker"
                            size="25px"
                            icon={<FaSmile />}
                            color="teal.400"
                            variant="ghost"
                            _hover={{ transform: "scale(1.05)" }}
                            _active={{ transform: "scale(0.95)" }}
                            transition="all 0.1s ease-in-out"
                            cursor="pointer"
                            p={2}
                            minW="auto"
                            borderRadius="md"
                            onClick={onOpen}
                            ml="auto"
                            m="-1"
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
            </HStack>


            <Flex w="100%" align="flex-start" gap={1}>
                <Textarea
                    ref={ref || internalRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Write a message..."
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
                    flex={1}
                    alignSelf="center"
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
                    leftIcon={<Image src={iconSrc} boxSize="25px" />}
                    variant="ghost"
                    isDisabled={disabled}
                    _hover={{ transform: "scale(1.1)" }}
                    _active={{ transform: "scale(0.95)" }}
                    transition="all 0.1s ease-in-out"
                    cursor="pointer"
                    p={2}
                    ml="auto"
                    mr="-4"
                />
            </Flex>

        </HStack>
    );
});

export default InputBar;