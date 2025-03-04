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
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { type ApiError, ItemsService, PropertiesFormData } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";

interface PropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (propertiesId: string) => void; // Змінено на string, бо ID приходить як UUID
}



const PropertiesModal = ({ isOpen, onClose, onSave }: PropertiesModalProps) => {
  const showToast = useCustomToast();
  const { register, handleSubmit, reset } = useForm<PropertiesFormData>();

  // Мутація для створення проперті через JSON
  const mutation = useMutation({
    mutationFn: async (data: PropertiesFormData) => {
      return ItemsService.createProperty(
          JSON.parse(JSON.stringify(data)) // Ось тут виправлення
      );
    },
    onSuccess: (response) => {
      showToast("Success!", "Properties created successfully.", "success");
      onSave(response.ID); // Передача отриманого ID у товар
      onClose();
      reset();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
  });

  const onSubmit = (data: PropertiesFormData) => {
    mutation.mutate({
      ...data,
      brand: data.brand || "", // Якщо немає значення, передаємо порожній рядок
    });
  };

  return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add Properties</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Height</FormLabel>
              <Input id="height" {...register("height")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Width</FormLabel>
              <Input id="width" {...register("width")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Weight</FormLabel>
              <Input id="weight" {...register("weight")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Color</FormLabel>
              <Input id="color" {...register("color")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Material</FormLabel>
              <Input id="material" {...register("material")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Brand</FormLabel>
              <Input id="brand" {...register("brand")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Motif</FormLabel>
              <Input id="motif" {...register("motif")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Size</FormLabel>
              <Input id="size" {...register("size")} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Style</FormLabel>
              <Input id="style" {...register("style")} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" type="submit" colorScheme="teal" isLoading={mutation.isPending}>
              Save Properties
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
};

export default PropertiesModal;
