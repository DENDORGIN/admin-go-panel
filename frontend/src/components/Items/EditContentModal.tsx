import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Button, FormControl, FormLabel
} from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { type ItemUpdate, ItemsService, type ApiError, type ItemPublic } from "../../client"
import { handleError } from "../../utils"
import useCustomToast from "../../hooks/useCustomToast"
import ReactQuill from "react-quill";

interface EditContentModalProps {
    isOpen: boolean
    onClose: () => void
    item: ItemPublic
    onSuccess: () => void
}

const EditContentModal = ({ isOpen, onClose, item, onSuccess }: EditContentModalProps) => {
    const showToast = useCustomToast()

    const {
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<ItemUpdate>({
        defaultValues: { content: item.content }
    })

    const mutation = useMutation({
        mutationFn: (data: ItemUpdate) => ItemsService.updateItem(item.ID, data),
        onSuccess: () => {
            showToast("Success", "Content updated", "success" )
            onSuccess()
            onClose()
        },
        onError: (err: ApiError) => handleError(err, showToast)
    })

    const onSubmit = (data: ItemUpdate) => mutation.mutate(data)

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'font': [] }],
            [{ 'color': [] }, { 'background': [] }], // Колір тексту та фону
            [{ 'align': [] }], // Вирівнювання
            ['bold', 'italic', 'underline', 'strike'], // Стилізація тексту
            [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Списки
            [{ 'indent': '-1' }, { 'indent': '+1' }], // Відступи
            ['link', 'image', 'video'], // Додавання медіа
            ['clean'], // Очищення форматування
        ],
    };

    const formats = [
        'header', 'font', 'color', 'background', 'align',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'indent',
        'link', 'image', 'video'
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
                <ModalHeader>Edit Content</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl isInvalid={!!errors.content} isRequired>
                        <FormLabel>Content</FormLabel>
                        <ReactQuill
                            theme="snow"
                            value={watch('content') || ''}
                            onChange={(_, __, ___, editor) => {
                                setValue('content', editor.getHTML());
                            }}
                            modules={modules}
                            formats={formats}
                        />
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>Save</Button>
                    <Button onClick={onClose} ml={3}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default EditContentModal
