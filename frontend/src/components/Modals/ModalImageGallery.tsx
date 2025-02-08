import { Box, Image } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

interface ModalImageGalleryProps {
  images: string[] // Масив посилань на зображення
  title: string // Опціональна назва
}

const ModalImageGallery = ({
  images: initialImages,
  title,
}: ModalImageGalleryProps) => {
  const [images, setImages] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Синхронізуємо зображення, якщо `initialImages` змінюється
  useEffect(() => {
    setImages(initialImages || [])
  }, [initialImages])

  const openLightbox = (index: number) => {
    if (images.length > 0) {
      setCurrentIndex(index)
      setIsOpen(true)
    }
  }

  const closeLightbox = () => {
    setIsOpen(false)
  }

  return (
    <Box display="flex" flexWrap="wrap" justifyContent="center" gap="10px">
      {images.slice(0, 3).map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={title || `Image ${index + 1}`}
          maxW="100px"
          maxH="100px"
          cursor="pointer"
          onClick={() => openLightbox(index)}
          onError={(e) => {
            console.error("Failed to load image:", e.currentTarget.src)
            e.currentTarget.src = "/path/to/placeholder.jpg" // Fallback image
          }}
        />
      ))}
      <Lightbox
        open={isOpen}
        close={closeLightbox}
        index={currentIndex}
        slides={images.map((src) => ({ src }))}
        controller={{ closeOnBackdropClick: true }}
      />
    </Box>
  )
}

export default ModalImageGallery
