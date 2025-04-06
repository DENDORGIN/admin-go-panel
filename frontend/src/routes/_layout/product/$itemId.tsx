import {
    Box,
    Container,
    Divider,
    Flex,
    Heading,
    Link,
    Spinner,
    Stack,
    Text,
    Tag,
    Badge,
    IconButton
} from "@chakra-ui/react"
import { EditIcon, CloseIcon } from "@chakra-ui/icons"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {type ApiError, ItemsService} from "../../../client"
import { ArrowBackIcon } from "@chakra-ui/icons"
import { useNavigate } from "@tanstack/react-router"
import ImageGallery from "../../../components/Modals/ModalImageGallery.tsx";
import DOMPurify from "dompurify";
import React, { useState } from "react";
import EditableProperties from "../../../components/Items/EditableProperties.tsx"
import EditableImages from "../../../components/Items/EditableImages"
import EditTitleModal from "../../../components/Items/EditTitleModal"
import EditContentModal from "../../../components/Items/EditContentModal"
import EditPriceModal from "../../../components/Items/EditPriceModal"
import EditQuantityModal from "../../../components/Items/EditQuantityModal.tsx";

export const Route = createFileRoute("/_layout/product/$itemId")({
    component: ItemDetails,
})

// Компонент для відображення HTML-контенту
interface SafeHtmlComponentProps {
    htmlContent: string; // Вказуємо, що це рядок
}

const SafeHtmlComponent: React.FC<SafeHtmlComponentProps> = ({ htmlContent }) => {
    return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />;
};

function ItemDetails() {
    const { itemId } = Route.useParams()
    const navigate = useNavigate()

    const [isEditingImages, setIsEditingImages] = useState(false)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isEditingContent, setIsEditingContent] = useState(false)
    const [isEditingPrice, setIsEditingPrice] = useState(false)
    const [isEditingQuantity, setIsEditingQuantity] = useState(false)


    const { data: item, isLoading, error, refetch: refetchItem } = useQuery({
        queryKey: ["item", itemId],
        queryFn: () => ItemsService.readItemById({ id: itemId }),
        enabled: !!itemId
    })


    const getCurrencySymbol = (lang: string) => {
        switch (lang) {
            case "pl":
                return "zł"
            case "ua":
                return "грн"
            case "en":
                return "$"
            case "de":
                return "€"
            case "fr":
                return "€"
            default:
                return ""
        }
    }


    if (isLoading)
        return (
            <Flex justify="center" align="center" h="50vh">
                <Spinner size="xl" />
            </Flex>
        )

    if (!item || error)
        return <Text textAlign="center">Товар не знайдено або сталася помилка.</Text>

    const imageArray = Array.isArray(item.images)
        ? item.images
        : item.images
            ? [item.images]
            : []


    return (
        <Container maxW="4xl" py={8}>
            <Link
                onClick={() => navigate({ to: "/items" })}
                color="blue.500"
                fontWeight="medium"
                mb={4}
                display="inline-flex"
                alignItems="center"
                px={10}
            >
                <ArrowBackIcon mr={2} />
                Back to the product list
            </Link>

            <Flex justify="space-between" align="center" mb={1}>
                <Text fontWeight="bold">Title:</Text>
                <IconButton
                    icon={<EditIcon />}
                    color={isEditingImages? "gray.600" : "orange.500"}
                    size="sm"
                    aria-label="Edit title"
                    onClick={() => setIsEditingTitle(true)}
                />
            </Flex>

            <Heading size="lg" mb={2}>{item.title}</Heading>

            <EditTitleModal
                isOpen={isEditingTitle}
                onClose={() => setIsEditingTitle(false)}
                item={item}
                onSuccess={() => refetchItem()}
            />

            <Text color="gray.500" mb={4}>
                Category: {item.category || "Not Category"} | Language:{" "}
                {item.language?.toUpperCase()}
            </Text>

            <Divider my={4} />

            <Stack spacing={4}>
                <Box whiteSpace="pre-wrap" padding="4px">
                    <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="bold">Content:</Text>
                        <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            color="orange.500"
                            aria-label="Edit content"
                            onClick={() => setIsEditingContent(true)}
                        />
                    </Flex>
                    <SafeHtmlComponent htmlContent={item.content || "N/A"} />
                </Box>

                <EditContentModal
                    isOpen={isEditingContent}
                    onClose={() => setIsEditingContent(false)}
                    item={item}
                    onSuccess={() => refetchItem()}
                />


                <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                        <Text fontWeight="bold">Images:</Text>
                        <IconButton
                            icon={isEditingImages ? <CloseIcon /> : <EditIcon />}
                            color={isEditingImages ? "gray.600" : "orange.500"}
                            size="sm"
                            aria-label="Edit images"
                            onClick={() => setIsEditingImages(!isEditingImages)}
                        />
                    </Flex>

                    {/* Галерея (режим перегляду) */}
                    <Box display={isEditingImages ? "none" : "block"}>
                        <ImageGallery
                            images={imageArray}
                            title={item.title}
                            numberOfImages={imageArray.length}
                        />
                    </Box>

                    {/* Редагування зображень */}
                    <Box display={isEditingImages ? "block" : "none"}>
                        <EditableImages itemId={item.ID}
                                        initialImages={imageArray}
                                        onImagesUpdated={() => refetchItem()}/>
                    </Box>
                </Box>


                {item.property?.ID && (
                <EditableProperties
                    propertyId={item.property.ID}
                    property={item.property}
                    onSuccess={() => console.log("Оновлено!")}
                    onError={(err: ApiError) => console.warn("Помилка редагування:", err)}
                                    />
                )}

                <Box>
                    <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="bold">Cost:</Text>
                        <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            color="orange.500"
                            aria-label="Edit price"
                            onClick={() => setIsEditingPrice(true)}
                        />
                    </Flex>
                    <Tag size="lg" colorScheme="green">
                        {item.price} {getCurrencySymbol(item.language)}
                    </Tag>
                </Box>

                <EditPriceModal
                    isOpen={isEditingPrice}
                    onClose={() => setIsEditingPrice(false)}
                    item={item}
                    onSuccess={() => refetchItem()}
                />

                <Box>
                    <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="bold">Quantity:</Text>
                        <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            color="orange.500"
                            aria-label="Edit quantity"
                            onClick={() => setIsEditingQuantity(true)}
                        />
                    </Flex>
                    <Badge
                        colorScheme={
                            item.quantity === 0
                                ? "red"
                                : item.quantity < 10
                                    ? "yellow"
                                    : "purple"
                        }
                        fontSize="md"
                        p={1}
                    >
                        {item.quantity}
                    </Badge>

                </Box>

                <EditQuantityModal
                    isOpen={isEditingQuantity}
                    onClose={() => setIsEditingQuantity(false)}
                    item={item}
                    onSuccess={() => refetchItem()}
                />


                {/*<Box>*/}
                {/*    <Text fontWeight="bold">Quantity:</Text>*/}
                {/*    <Badge colorScheme="purple" fontSize="md" p={1}>*/}
                {/*        {item.quantity}*/}
                {/*    </Badge>*/}
                {/*</Box>*/}

                <Box>
                    <Text fontWeight="bold">URL:</Text>
                    {item.item_url ? (
                        <Link
                        href={item.item_url || "#"}
                        isExternal
                        color="blue.500"
                        textDecoration="underline"
                      >
                        {item.item_url ? formatUrl(item.item_url) : "No URL"}
                      </Link>
                    ) : (
                        "Not URL"
                    )}
                </Box>

                <Box>
                    <Text fontWeight="bold">Status:</Text>
                    <Flex align="center" gap={2}>
                        <Box
                            w="12px"
                            h="12px"
                            borderRadius="full"
                            bg={item.status ? "green.500" : "red.500"}
                        />
                        {item.status ? "Active" : "Inactive"}
                    </Flex>
                </Box>
            </Stack>
        </Container>
    )
}


function formatUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname // This will display only the domain part of the URL
  } catch (error) {
    return url || "No URL" // Fallback if the URL is invalid or empty
  }
}
