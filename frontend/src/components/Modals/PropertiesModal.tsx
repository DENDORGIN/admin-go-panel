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
} from "@chakra-ui/react"
import { useForm } from "react-hook-form"

interface PropertiesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (properties: Properties) => void
}
interface Properties {
  height: string
  width: string
  weight: string
  color: string
  material: string
  brand: string
  motif: string
  style: string
}

interface PropertiesFormData {
  height: string
  width: string
  weight: string
  color: string
  material: string
  brand: string
  motif: string
  style: string
}

const PropertiesModal = ({ isOpen, onClose, onSave }: PropertiesModalProps) => {
  const { register, handleSubmit, reset } = useForm<PropertiesFormData>()

  const onSubmit = (data: PropertiesFormData) => {
    console.log(data)
    onSave({
      height: data.height,
      width: data.width,
      weight: data.weight,
      color: data.color,
      material: data.material,
      brand: data.brand,
      motif: data.motif,
      style: data.style,
    })
    onClose()
    reset()
  }

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
            <FormLabel>Style</FormLabel>
            <Input id="style" {...register("style")} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" type="submit" colorScheme="teal">
            Save Properties
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PropertiesModal
