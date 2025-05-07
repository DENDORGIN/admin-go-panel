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
  IconButton,
  Button,
  Collapse,
  AbsoluteCenter,
  Td,
  Table,
} from "@chakra-ui/react"
import { useColorModeValue } from "@chakra-ui/react"
import { EditIcon, CloseIcon, ExternalLinkIcon, ArrowBackIcon } from "@chakra-ui/icons"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {type ApiError, EmployeeService, type UserEmployeePublic} from "../../../client"
import { useNavigate } from "@tanstack/react-router"
import ImageGallery from "../../../components/Modals/ModalImageGallery.tsx";
// import ImageGallery from "../../../components/Modals/ModalImageGallery.tsx";
// import DOMPurify from "dompurify";
// import { useState } from "react";
// import EditableProperties from "../../../components/Items/EditableProperties.tsx"
// import EditableImages from "../../../components/Items/EditableImages"
// import EditTitleModal from "../../../components/Items/Modals/EditTitleModal.tsx"
// import EditContentModal from "../../../components/Items/Modals/EditContentModal.tsx"
// import EditPriceModal from "../../../components/Items/Modals/EditPriceModal.tsx"
// import EditQuantityModal from "../../../components/Items/Modals/EditQuantityModal.tsx";
// import EditPositionModal from "../../../components/Items/Modals/EditPositionModal.tsx"
// import EditUrlModal from "../../../components/Items/Modals/EditUrlModal.tsx"
// import ItemStatusSwitch from "../../../components/Items/ItemStatusSwitch"
// import EditMetaModal from "../../../components/Items/Modals/EditMetaModal"



export const Route = createFileRoute("/_layout/user/$userId")({
  component: UserDetails,
})

// Компонент для відображення HTML-контенту
interface SafeHtmlComponentProps {
  htmlContent: string; // Вказуємо, що це рядок
}

// function SafeHtmlComponent({ htmlContent }: SafeHtmlComponentProps) {
//   return (
//       <Box
//           className="content"
//           dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
//       />
//   )
// }

function UserDetails() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()

  // const [isEditingImages, setIsEditingImages] = useState(false)
  // const [isEditingTitle, setIsEditingTitle] = useState(false)
  //
  // const [isEditingContent, setIsEditingContent] = useState(false)
  // const [showFullContent, setShowFullContent] = useState(false)
  //
  // const [isEditingPrice, setIsEditingPrice] = useState(false)
  // const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  // const [isEditingUrl, setIsEditingUrl] = useState(false)
  // const [isEditingPosition, setIsEditingPosition] = useState(false)
  // const [isEditingMeta, setIsEditingMeta] = useState(false)

  const contentBg = useColorModeValue("white", "#1A202C")

  const { data: user, isLoading, error, refetch: refetchUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => EmployeeService.readEmployeeById({ userId }),
    enabled: !!userId
  })



  if (isLoading)
    return (
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" />
        </Flex>
    )

  if (!user || error)
    return <Text textAlign="center">Товар не знайдено або сталася помилка.</Text>


  return (
      <Container maxW="4xl" py={8}>
        <Link
            onClick={() => navigate({ to: "/admin" })}
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

        {/*<Flex justify="space-between" align="center" mb={1}>*/}
        {/*  <Box flex="1" position="relative">*/}
        {/*    <Divider />*/}
        {/*    <AbsoluteCenter bg={contentBg} fontWeight="bold" px="4">*/}
        {/*      Title*/}
        {/*    </AbsoluteCenter>*/}
        {/*  </Box>*/}
        {/*  <IconButton*/}
        {/*      icon={<EditIcon />}*/}
        {/*      color={isEditingImages? "gray.600" : "orange.500"}*/}
        {/*      size="sm"*/}
        {/*      ml={4}*/}
        {/*      aria-label="Edit title"*/}
        {/*      onClick={() => setIsEditingTitle(true)}*/}
        {/*  />*/}
        {/*</Flex>*/}
      <Table>
        <Heading size="lg"  mb={2}>{user.fullName}</Heading>
        <Td>
          <ImageGallery images={Array.isArray(user.avatar) ? user.avatar : user.avatar ? [user.avatar] : []}
                        title={user.fullName}
                        numberOfImages={1}
          />
        </Td></Table>


        {/*<EditTitleModal*/}
        {/*    isOpen={isEditingTitle}*/}
        {/*    onClose={() => setIsEditingTitle(false)}*/}
        {/*    user={user}*/}
        {/*    onSuccess={() => refetchUser()}*/}
        {/*/>*/}

        {/*<Flex justify="space-between" align="center" mb={1}>*/}
        {/*  <Text color="gray.500">*/}
        {/*    Category: {user.category || "Not Category"} | Language:{" "}*/}
        {/*    {item.language?.toUpperCase()}*/}
        {/*  </Text>*/}
        {/*  <IconButton*/}
        {/*      icon={<EditIcon />}*/}
        {/*      size="sm"*/}
        {/*      aria-label="Edit meta"*/}
        {/*      color="orange.500"*/}
        {/*      onClick={() => setIsEditingMeta(true)}*/}
        {/*  />*/}
        {/*</Flex>*/}

        {/*<EditMetaModal*/}
        {/*    isOpen={isEditingMeta}*/}
        {/*    onClose={() => setIsEditingMeta(false)}*/}
        {/*    item={item}*/}
        {/*    onSuccess={() => refetchItem()}*/}
        {/*/>*/}



        {/*<Stack spacing={4}>*/}

        {/*  <Box py={4}>*/}
        {/*    <Flex align="center" mb={4}>*/}
        {/*      <Box flex="1" position="relative">*/}
        {/*        <Divider />*/}
        {/*        <AbsoluteCenter bg={contentBg} fontWeight="bold" px="4">*/}
        {/*          Content*/}
        {/*        </AbsoluteCenter>*/}
        {/*      </Box>*/}

        {/*      <IconButton*/}
        {/*          icon={<EditIcon />}*/}
        {/*          size="sm"*/}
        {/*          color="orange.500"*/}
        {/*          aria-label="Edit content"*/}
        {/*          ml={4}*/}
        {/*          onClick={() => setIsEditingContent(true)}*/}
        {/*      />*/}
        {/*    </Flex>*/}


        {/*    <Collapse startingHeight={100} in={showFullContent}>*/}
        {/*      <SafeHtmlComponent htmlContent={user.content || "N/A"} />*/}
        {/*    </Collapse>*/}

        {/*    <Button*/}
        {/*        size="sm"*/}
        {/*        onClick={() => setShowFullContent(!showFullContent)}*/}
        {/*        mt="0.5rem"*/}
        {/*        variant="link"*/}
        {/*        colorScheme="blue"*/}
        {/*    >*/}
        {/*      Show {showFullContent ? "Less" : "More"}*/}
        {/*    </Button>*/}
        {/*  </Box>*/}

        {/*  <EditContentModal*/}
        {/*      isOpen={isEditingContent}*/}
        {/*      onClose={() => setIsEditingContent(false)}*/}
        {/*      item={item}*/}
        {/*      onSuccess={() => refetchItem()}*/}
        {/*  />*/}

        {/*  <Box>*/}
        {/*    <Flex align="center" mb={4}>*/}
        {/*      <Box flex="1" position="relative">*/}
        {/*        <Divider />*/}
        {/*        <AbsoluteCenter bg={contentBg} fontWeight="bold" px="4">*/}
        {/*          Images*/}
        {/*        </AbsoluteCenter>*/}
        {/*      </Box>*/}
        {/*      <IconButton*/}
        {/*          icon={isEditingImages ? <CloseIcon /> : <EditIcon />}*/}
        {/*          color={isEditingImages ? "gray.600" : "orange.500"}*/}
        {/*          size="sm"*/}
        {/*          aria-label="Edit images"*/}
        {/*          ml={4}*/}
        {/*          onClick={() => setIsEditingImages(!isEditingImages)}*/}
        {/*      />*/}
        {/*    </Flex>*/}

        {/*    /!* Галерея (режим перегляду) *!/*/}
        {/*    <Box display={isEditingImages ? "none" : "block"}>*/}
        {/*      <ImageGallery*/}
        {/*          images={imageArray}*/}
        {/*          title={user.title}*/}
        {/*          numberOfImages={imageArray.length}*/}
        {/*      />*/}
        {/*    </Box>*/}

        {/*    /!* Редагування зображень *!/*/}
        {/*    <Box display={isEditingImages ? "block" : "none"}>*/}
        {/*      <EditableImages itemId={user.ID}*/}
        {/*                      initialImages={imageArray}*/}
        {/*                      onImagesUpdated={() => refetchItem()}/>*/}
        {/*    </Box>*/}
        {/*  </Box>*/}


        {/*  {user.property?.ID && (*/}
        {/*      <EditableProperties*/}
        {/*          propertyId={user.property.ID}*/}
        {/*          property={user.property}*/}
        {/*          bgColor={contentBg}*/}
        {/*          onSuccess={() => console.log("Оновлено!")}*/}
        {/*          onError={(err: ApiError) => console.warn("Помилка редагування:", err)}*/}
        {/*      />*/}
        {/*  )}*/}

        {/*  <Box>*/}
        {/*    <Flex justify="space-between" align="center" mb={1}>*/}
        {/*      <Box flex="1" position="relative">*/}
        {/*        <Divider />*/}
        {/*        <AbsoluteCenter bg={contentBg} fontWeight="bold" px="4">*/}
        {/*          Cost*/}
        {/*        </AbsoluteCenter>*/}
        {/*      </Box>*/}
        {/*      <IconButton*/}
        {/*          icon={<EditIcon />}*/}
        {/*          size="sm"*/}
        {/*          color="orange.500"*/}
        {/*          ml={4}*/}
        {/*          aria-label="Edit price"*/}
        {/*          onClick={() => setIsEditingPrice(true)}*/}
        {/*      />*/}
        {/*    </Flex>*/}

        {/*  <EditPriceModal*/}
        {/*      isOpen={isEditingPrice}*/}
        {/*      onClose={() => setIsEditingPrice(false)}*/}
        {/*      item={item}*/}
        {/*      onSuccess={() => refetchItem()}*/}
        {/*  />*/}

        {/*  <Box>*/}
        {/*    <Flex justify="space-between" align="center" mb={1}>*/}
        {/*      <Box flex="1" position="relative">*/}
        {/*        <Divider />*/}
        {/*        <AbsoluteCenter bg={contentBg} fontWeight="bold" px="4">*/}
        {/*          Quantity*/}
        {/*        </AbsoluteCenter>*/}
        {/*      </Box>*/}
        {/*      <IconButton*/}
        {/*          icon={<EditIcon />}*/}
        {/*          size="sm"*/}
        {/*          color="orange.500"*/}
        {/*          aria-label="Edit quantity"*/}
        {/*          onClick={() => setIsEditingQuantity(true)}*/}
        {/*      />*/}
        {/*    </Flex>*/}
        {/*    <Tag*/}
        {/*        colorScheme={*/}
        {/*          user.quantity === 0*/}
        {/*              ? "red"*/}
        {/*              : user.quantity < 10*/}
        {/*                  ? "yellow"*/}
        {/*                  : "purple"*/}
        {/*        }*/}
        {/*        size="lg"*/}
        {/*    >*/}
        {/*      {user.quantity}*/}
        {/*    </Tag>*/}
        {/*  </Box>*/}


        {/*  <EditQuantityModal*/}
        {/*      isOpen={isEditingQuantity}*/}
        {/*      onClose={() => setIsEditingQuantity(false)}*/}
        {/*      item={item}*/}
        {/*      onSuccess={() => refetchItem()}*/}
        {/*  />*/}

        {/*  <Box>*/}
        {/*    <Flex justify="space-between" align="center" mb={1}>*/}
        {/*      <Box flex="1" position="relative">*/}
        {/*        <Divider />*/}
        {/*        <AbsoluteCenter bg={contentBg} fontWeight="bold" px="4">*/}
        {/*          URL*/}
        {/*        </AbsoluteCenter>*/}
        {/*      </Box>*/}
        {/*      <IconButton*/}
        {/*          icon={<EditIcon />}*/}
        {/*          size="sm"*/}
        {/*          color="orange.500"*/}
        {/*          aria-label="Edit Url"*/}
        {/*          onClick={() => setIsEditingUrl(true)}*/}
        {/*      />*/}
        {/*    </Flex>*/}
        {/*    {user.item_url ? (*/}
        {/*        <Link*/}
        {/*            href={user.item_url || "#"}*/}
        {/*            isExternal*/}
        {/*            color="blue.500"*/}
        {/*            textDecoration="underline"*/}
        {/*        >*/}
        {/*          {user.item_url ? formatUrl(user.item_url) : "No URL"}*/}
        {/*          <ExternalLinkIcon mx='4px' />*/}
        {/*        </Link>*/}
        {/*    ) : (*/}
        {/*        "Not URL"*/}
        {/*    )}*/}
        {/*  </Box>*/}

        {/*  <EditUrlModal*/}
        {/*      isOpen={isEditingUrl}*/}
        {/*      onClose={() => setIsEditingUrl(false)}*/}
        {/*      item={item}*/}
        {/*      onSuccess={() => refetchItem()}*/}
        {/*  />*/}

        {/*  <Box>*/}
        {/*    <Flex justify="space-between" align="center" mb={1}>*/}
        {/*      <Box flex="1" position="relative">*/}
        {/*        <Divider />*/}
        {/*        <AbsoluteCenter bg={contentBg} fontWeight="bold" px="4">*/}
        {/*          Position*/}
        {/*        </AbsoluteCenter>*/}
        {/*      </Box>*/}
        {/*      <IconButton*/}
        {/*          icon={<EditIcon />}*/}
        {/*          size="sm"*/}
        {/*          color="orange.500"*/}
        {/*          aria-label="Edit price"*/}
        {/*          onClick={() => setIsEditingPosition(true)}*/}
        {/*      />*/}
        {/*    </Flex>*/}
        {/*    <Tag size="lg" colorScheme="green">*/}
        {/*      {item.position}*/}
        {/*    </Tag>*/}
        {/*  </Box>*/}

        {/*  <EditPositionModal*/}
        {/*      isOpen={isEditingPosition}*/}
        {/*      onClose={() => setIsEditingPosition(false)}*/}
        {/*      item={item}*/}
        {/*      onSuccess={() => refetchItem()}*/}
        {/*  />*/}

        {/*  <Divider />*/}

          {/*<ItemStatusSwitch user={user} onUpdated={() => refetchItem()} />*/}


      {/*    <Divider />*/}
      {/*  </Stack>*/}
      </Container>
  )
}


// function formatUrl(url: string) {
//   try {
//     const { hostname } = new URL(url)
//     return hostname // This will display only the domain part of the URL
//   } catch (error) {
//     return url || "No URL" // Fallback if the URL is invalid or empty
//   }
// }
