import {
  Box,
  Container,
  Flex,
  Heading,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Badge
} from "@chakra-ui/react"
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { z } from "zod"

import { ItemsService } from "../../client"
import ActionsMenu from "../../components/Common/ActionsMenu.tsx"
import Navbar from "../../components/Common/Navbar"
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx"
import AddItem, { type AddItemProps } from "../../components/Items/AddItem"
import ImageGallery from "../../components/Modals/ModalImageGallery.tsx"
import { UseAvailableLanguages } from "../../hooks/useAvailableLanguages.ts"

const itemsSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

const PER_PAGE = 7

interface ItemsTableProps {
  language: string // Визначення типу для 'language'
}

interface ItemsQueryOptions {
  page: number
  language: string
}

function getItemsQueryOptions({ page, language }: ItemsQueryOptions) {
  return {
    queryFn: () =>
      ItemsService.readItems({
        language,
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    queryKey: ["items", language, { page }],
  }
}


function ItemsTable({ language }: ItemsTableProps) {
  const queryClient = useQueryClient()
  const { page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const {
    data: items,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getItemsQueryOptions({ page, language }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && Array.isArray(items?.Data) && items.Data.length === PER_PAGE
  const hasPreviousPage = page > 1

  useEffect(() => {
    if (Array.isArray(items?.Data)) {
      console.log("Loaded product Data:", items.Data);
    }
    if (hasNextPage) {
      queryClient.prefetchQuery(
          getItemsQueryOptions({ page: page + 1, language }),
      );
    }
  }, [page, queryClient, hasNextPage, language]);


  return (
    <>
      <TableContainer >
        <Table size={{ base: "sm", md: "md" }} fontSize="sm">
          <Thead>
            <Tr>
              <Th>Position</Th>
              <Th>Title</Th>
              <Th>Images</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>Quantity</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(9).fill(null).map(
                  (
                    _,
                    index, // Adjust array length to match column count
                  ) => (
                    <Td key={index}>
                      <SkeletonText noOfLines={1} paddingBlock="16px" />
                    </Td>
                  ),
                )}
              </Tr>
            </Tbody>
          ) : (
              <Tbody>
                {(items?.Data || []).map((item) => {
                  const imageArray = Array.isArray(item.images)
                      ? item.images
                      : item.images
                          ? [item.images]
                          : []

                  return (
                      <Tr
                          key={item.ID}
                          opacity={isPlaceholderData ? 0.5 : 1}
                          cursor="pointer"
                          _hover={{ bg: "gray.50" }}
                          onClick={() =>
                              navigate({ to: `/product/$itemId`, params: { itemId: item.ID } })
                          }
                      >
                        <Td>{item.position}</Td>

                        <Td>{item.title}</Td>

                        <Td
                            onClick={(e) => e.stopPropagation()} // 🛑 Зупиняє перехід
                        >
                          {imageArray.length > 0 ? (
                              <ImageGallery
                                  images={imageArray}
                                  title={item.title}
                                  numberOfImages={1}
                              />
                          ) : (
                              <Badge colorScheme="gray" variant="subtle">
                                N/A
                              </Badge>
                          )}
                        </Td>

                        <Td>{item.category || "No Category"}</Td>
                        <Td>{item.price}</Td>
                        <Td>{item.quantity}</Td>

                        <Td py={1} px={2} fontSize="sm">
                          <Flex align="center" gap={1}>
                            <Box
                                w="10px"
                                h="10px"
                                borderRadius="full"
                                bg={item.status ? "green.500" : "red.500"}
                            />
                            {item.status ? "Active" : "Inactive"}
                          </Flex>
                        </Td>

                        <Td
                            onClick={(e) => e.stopPropagation()} // ⛔ щоб ActionsMenu працював
                        >
                          <ActionsMenu type={"Item"} value={item} />
                        </Td>
                      </Tr>
                  )
                })}
              </Tbody>


          )}
        </Table>
      </TableContainer>
      <PaginationFooter
        page={page}
        onChangePage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </>
  )
}

function Items() {

  const { data: fetchedLanguages = [], isLoading } = UseAvailableLanguages()
  const [languages, setLanguages] = useState<string[]>([])
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  useEffect(() => {
    setLanguages(fetchedLanguages)
  }, [fetchedLanguages])

  if (isLoading) {
    return <Box p={6}>Loading languages...</Box>
  }
  if (!languages || languages.length === 0) {
    return <Box p={6}>No languages available to display.</Box>
  }

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case "pl": return "Polish"
      case "en": return "English"
      case "de": return "German"
      case "ua": return "Ukrainian"
      case "it": return "Italian"
      case "es": return "Spanish"
      case "fr": return "France"
      case "lv": return "Latvia"
      case "lt": return "Lithuanian"
      case "ro": return "Romanian"
      case "bg": return "Bulgarian"
      case "tr": return "Turkish"
      case "el": return "Greek"
      case "nl": return "Dutch"
      case "sv": return "Swedish"
      case "cs": return "Czech"
      case "sk": return "Slovak"
      case "hu": return "Hungarian"
      default: return code.toUpperCase()
    }
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={10}>
        Items Management
      </Heading>

      <Navbar
          type={"Item"}
          addModalAs={(props: AddItemProps) => (
              <AddItem
                  {...props}
                  onNewLanguage={(lang) => {
                    if (!languages.includes(lang)) {
                      setLanguages((prev) => [...prev, lang])
                      setActiveTabIndex(languages.length)
                    }
                  }}
              />
          )}
      />

      <Tabs
          isFitted
          variant="enclosed"
          index={activeTabIndex}
          onChange={setActiveTabIndex}
      >
        <Box overflowX="auto" whiteSpace="nowrap">
          <TabList mb="1em" minW="max-content" width="full">
            {languages.map((lang) => (
                <Tab key={lang} _selected={{ color: "white", bg: "#D65A17" }} flexShrink={0}>
                  {getLanguageLabel(lang)}
                </Tab>
            ))}
          </TabList>
        </Box>

        <TabPanels>
            {languages?.map((lang) => (
                <TabPanel key={lang}>
                  <ItemsTable language={lang} />
                </TabPanel>
            ))}
          </TabPanels>
      </Tabs>
    </Container>
  )
}

