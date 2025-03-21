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
  Textarea,
  Radio,
  RadioGroup,
  VStack,
  HStack,
  Text,
  Box,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import useCustomToast from "../../hooks/useCustomToast";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (newEvent: any) => void;
  selectedDate: { startStr: string; endStr: string; allDay: boolean } | null;
}

interface EventFormValues {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  reminderOffset?: number;
  allDay: boolean;
  color?: string | null;
  eventType: string;
  sendEmail: boolean;
}

const eventTypes = ["workingDay", "sickDay", "vacation", "weekend"];

const AddEventModal: React.FC<AddEventModalProps> = ({
                                                       isOpen,
                                                       onClose,
                                                       onAddEvent,
                                                       selectedDate,
                                                     }) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<EventFormValues>();

  const [sendEmail, setSendEmail] = useState(false);
  // Обробник зміни чекбокса
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendEmail(!e.target.checked); // Якщо зняли галочку → sendEmail = true
  };

  const handleClose = () => {
    reset();
    setSendEmail(false); // Скидаємо чекбокс при закритті модального вікна
    onClose();
  };

  useEffect(() => {
    if (selectedDate) {
      const start = new Date(selectedDate.startStr);
      const end = selectedDate.endStr ? new Date(selectedDate.endStr) : start;

      if (selectedDate.allDay) {
        setValue("startDate", "");
        setValue("endDate", "");
      } else {
        setValue("startDate", start.toTimeString().slice(0, 5));
        setValue("endDate", end.toTimeString().slice(0, 5));
      }
    }
  }, [selectedDate, setValue]);




  const showToast = useCustomToast();

  const onSubmit: SubmitHandler<EventFormValues> = (data) => {
    if (selectedDate) {
      const startDate = selectedDate.startStr.split("T")[0];
      const endDate = selectedDate.endStr
          ? new Date(selectedDate.endStr).toISOString().split("T")[0]
          : startDate;
      const formattedStartDate = new Date(`${startDate}T${data.startDate}`).toISOString(); // Час браузера
      const formattedEndDate = new Date(`${endDate}T${data.endDate}`).toISOString();

      const newEvent = {
        title: data.title,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        reminderOffset: data.reminderOffset,
        allDay: selectedDate.allDay,
        description: data.description,
        color: data.color || null,
        workingDay: data.eventType === "workingDay",
        sickDay: data.eventType === "sickDay",
        vacation: data.eventType === "vacation",
        weekend: data.eventType === "weekend",
        sendEmail: sendEmail

      };

      onAddEvent(newEvent);
      showToast("Create!", "Event created successfully.", "success");
      reset();
      handleClose();
    }
  };

  const colors = ["red", "skyblue", "green", "violet", "orange", "pink"];
  const selectedColor = watch("color");
  const selectedEventType = watch("eventType");

  return (
      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Create Event</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="lg" fontWeight="bold">
              Selected Date:{" "}
              {selectedDate
                  ? `${new Date(selectedDate.startStr).toLocaleDateString()} ${
                      selectedDate.endStr
                          ? `- ${new Date(new Date(selectedDate.endStr).setDate(new Date(selectedDate.endStr).getDate() - 1)).toLocaleDateString()}`
                          : ""
                  }`
                  : "N/A"}
            </Text>

            <FormControl isRequired mt={4}>
              <FormLabel>Event Title</FormLabel>
              <Input placeholder="Enter event title" {...register("title", { required: true })} />
            </FormControl>

            <HStack mt={4}>
              <FormControl isRequired>
                <FormLabel>Start Time</FormLabel>
                <Input type="time" {...register("startDate", { required: true })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>End Time</FormLabel>
                <Input type="time" {...register("endDate", { required: true })} />
              </FormControl>
            </HStack>

            <FormControl mt={4}>
              <FormLabel>Reminder Offset (minutes)</FormLabel>
              <NumberInput
                  size="md"
                  maxW={24}
                  min={1}
                  defaultValue={15}
                  value={watch("reminderOffset") || 15}
                  onChange={(value) => setValue("reminderOffset", Number(value))} // ✅ Оновлюємо state
              >
                <NumberInputField {...register("reminderOffset", { required: true })} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>


            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Textarea placeholder="Enter event description" {...register("description")} />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Event Color</FormLabel>
              <HStack spacing={2}>
                {colors.map((color) => (
                    <Box
                        key={color}
                        width="30px"
                        height="30px"
                        borderRadius="md"
                        cursor="pointer"
                        bg={color}
                        border={selectedColor === color ? "3px solid black" : "1px solid gray"}
                        onClick={() => setValue("color", color)}
                    />
                ))}
              </HStack>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Event Type</FormLabel>
              <RadioGroup value={selectedEventType} onChange={(value) => setValue("eventType", value)}>
                <VStack align="start">
                  {eventTypes.map((type) => (
                      <Radio key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Radio>
                  ))}
                </VStack>
              </RadioGroup>

              {/* ✅ Чекбокс "Send Event" */}
              <FormControl mt={4}>
                <Checkbox
                    size="lg"
                    colorScheme="orange"
                    defaultChecked
                    onChange={handleCheckboxChange}
                >
                  Send Event
                </Checkbox>
              </FormControl>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="primary" mr={3} type="submit">
              Add Event
            </Button>
            <Button onClick={handleClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
};

export default AddEventModal;
