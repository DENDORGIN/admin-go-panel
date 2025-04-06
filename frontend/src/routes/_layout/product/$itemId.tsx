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
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {type ApiError, ItemsService} from "../../../client"
import { ArrowBackIcon } from "@chakra-ui/icons"
import { useNavigate } from "@tanstack/react-router"
import ImageGallery from "../../../components/Modals/ModalImageGallery.tsx";
import DOMPurify from "dompurify";
import React from "react";
import EditableProperties from "../../../components/Modals/EditablePropertiesModal"

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

    const { data: item, isLoading, error } = useQuery({
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

            <Heading size="lg" mb={2}>
                {item.title}
            </Heading>

            <Text color="gray.500" mb={4}>
                Category: {item.category || "Not Category"} | Language:{" "}
                {item.language?.toUpperCase()}
            </Text>

            <Divider my={4} />

            <Stack spacing={4}>
                <Box whiteSpace="pre-wrap" padding="4px">
                    <Text fontWeight="bold">Content:</Text>
                    <SafeHtmlComponent htmlContent={item.content || "N/A"} />
                </Box>

                <Box>
                    <Text fontWeight="bold">Images:</Text>
                    <ImageGallery
                        images={imageArray}
                        title={item.title}
                        numberOfImages={imageArray.length}
                    />
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
                    <Text fontWeight="bold">Cost:</Text>
                    <Tag size="lg" colorScheme="green">
                        {item.price} {getCurrencySymbol(item.language)}
                    </Tag>
                </Box>


                <Box>
                    <Text fontWeight="bold">Quantity:</Text>
                    <Badge colorScheme="purple" fontSize="md" p={1}>
                        {item.quantity}
                    </Badge>
                </Box>

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
