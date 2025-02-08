import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
} from "@chakra-ui/react"
import { type SubmitHandler, useForm } from "react-hook-form"

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onAddEvent: (newEvent: any) => void
  selectedDate: { startStr: string; endStr: string; allDay: boolean } | null
}

interface EventFormValues {
  title: string
  color: string
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  selectedDate,
}) => {
  const { register, handleSubmit, reset } = useForm<EventFormValues>()

  const onSubmit: SubmitHandler<EventFormValues> = (data) => {
    if (selectedDate) {
      const newEvent = {
        title: data.title,
        start: selectedDate.startStr,
        end: selectedDate.endStr,
        allDay: selectedDate.allDay,
        color: data.color || "#3788d8",
      }
      onAddEvent(newEvent)
      reset()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Create Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Event Title</FormLabel>
            <Input
              placeholder="Enter event title"
              {...register("title", { required: true })}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Event Color</FormLabel>
            <Select placeholder="Select color" {...register("color")}>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="violet">Violet</option>
              <option value="grey">Grey</option>
              <option value="pink">Pink</option>
              <option value="purple">Purple</option>
              <option value="orange">Orange</option>
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} type="submit">
            Add Event
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddEventModal
