import {
  Container,
  Flex,
  Link,
  Spinner,
  Text,
  Box,
  Divider,
  Stack,
  // IconButton,
  Input,
  FormControl,
  // useToast,
} from "@chakra-ui/react"
import { ArrowBackIcon, } from "@chakra-ui/icons" //EditIcon
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { EmployeeService } from "../../../client"
import { useNavigate } from "@tanstack/react-router"
import { useState, useRef } from "react"
import { useForm } from "react-hook-form"

export const Route = createFileRoute("/_layout/user/$userId")({
  component: UserDetails,
})

function UserDetails() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()
  // const toast = useToast()
  const fileInputRef = useRef(null)
  const { getValues, setValue } = useForm()
  const [file, setFile] = useState<{ file: File, preview: string } | null>(null)
  const [isSubmitting] = useState(false) //<----, setIsSubmitting

  // const [ setIsEditingName] = useState(false) //<----, setIsEditingName
  // const [ setIsEditingEmail] = useState(false) //<----, setIsEditingEmail
  // const [ setIsEditingCompany] = useState(false) //<----, setIsEditingCompany
  // const [ setIsEditingPosition] = useState(false) //<----, setIsEditingPosition

  const { data: user, isLoading, error,} = useQuery({  // <--- refetch
    queryKey: ["user", userId],
    queryFn: () => EmployeeService.readEmployeeById({ userId }),
    enabled: !!userId
  })

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const preview = URL.createObjectURL(selectedFile)
      setFile({ file: selectedFile, preview })
      setValue("avatar", preview)
      // TODO: додати логіку збереження на сервер
    }
  }

  function handleFileButtonClick() {
    if (user?.isSuperUser && fileInputRef.current) {
      (fileInputRef.current as HTMLInputElement).click()
    }
  }

  if (isLoading) {
    return (
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" />
        </Flex>
    )
  }

  if (!user || error) {
    return <Text textAlign="center">Користувача не знайдено або сталася помилка.</Text>
  }

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
          Back to the user list
        </Link>

        <Stack spacing={6}>
          {/* Аватар */}
          <Box>
            <Section title="Avatar">
              <FormControl mt={4}>
                <Input
                    ref={fileInputRef}
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    hidden
                    disabled={isSubmitting}
                />

                <Box
                    w="100px"
                    h="100px"
                    borderRadius="full"
                    overflow="hidden"
                    cursor={user?.isSuperUser ? "pointer" : "not-allowed"}
                    border="2px solid"
                    borderColor="gray.200"
                    _hover={{ opacity: user?.isSuperUser ? 0.8 : 1 }}
                    onClick={handleFileButtonClick}
                >
                  <img
                      src={
                          file?.preview ||
                          getValues("avatar") ||
                          user?.avatar ||
                          "https://via.placeholder.com/100x100?text=Avatar"
                      }
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              </FormControl>
            </Section>
          </Box>

          {/* Основна інформація */}
          {/*<Section title="Main Info">*/}
          {/*  <Info*/}
          {/*      label="Full Name"*/}
          {/*      value={user.fullName}*/}
          {/*      action={<IconButton icon={<EditIcon />} size="sm" onClick={() => setIsEditingName(true)} />}*/}
          {/*  />*/}
          {/*  <Info*/}
          {/*      label="Email"*/}
          {/*      value={user.email}*/}
          {/*      action={<IconButton icon={<EditIcon />} size="sm" onClick={() => setIsEditingEmail(true)} />}*/}
          {/*  />*/}
          {/*  <Info label="Active" value={user.isActive ? "Так" : "Ні"} />*/}
          {/*  <Info label="Admin" value={user.isAdmin ? "Так" : "Ні"} />*/}
          {/*  <Info label="Super User" value={user.isSuperUser ? "Так" : "Ні"} />*/}
          {/*</Section>*/}

          {/*/!* Контакти *!/*/}
          {/*<Section title="Contacts">*/}
          {/*  <Info label="Phone 1" value={user.phone_number_1} />*/}
          {/*  <Info label="Phone 2" value={user.phone_number_2} />*/}
          {/*  <Info label="Address" value={user.address} />*/}
          {/*</Section>*/}

          {/*/!* Робоча інформація *!/*/}
          {/*<Section title="Company Info">*/}
          {/*  <Info*/}
          {/*      label="Company"*/}
          {/*      value={user.company}*/}
          {/*      action={<IconButton icon={<EditIcon />} size="sm" onClick={() => setIsEditingCompany(true)} />}*/}
          {/*  />*/}
          {/*  <Info*/}
          {/*      label="Position"*/}
          {/*      value={user.position}*/}
          {/*      action={<IconButton icon={<EditIcon />} size="sm" onClick={() => setIsEditingPosition(true)} />}*/}
          {/*  />*/}
          {/*  <Info label="Contract Type" value={user.condition_type} />*/}
          {/*  <Info label="Salary" value={user.salary} />*/}
          {/*</Section>*/}

          {/*/!* Дати *!/*/}
          {/*<Section title="Dates">*/}
          {/*  <Info label="Start Date" value={user.date_start} />*/}
          {/*  <Info label="End Date" value={user.date_end} />*/}
          {/*  <Info label="Created At" value={new Date(user.created_at).toLocaleString()} />*/}
          {/*  <Info label="Updated At" value={new Date(user.updated_at).toLocaleString()} />*/}
          {/*</Section>*/}

          {/*/!* Автори *!/*/}
          {/*<Section title="Audit">*/}
          {/*  <Info label="Created By" value={user.whu_created_by} />*/}
          {/*  <Info label="Updated By" value={user.whu_updated_by} />*/}
          {/*</Section>*/}
        </Stack>
      </Container>
  )
}

function Section({
                   children
                 }: {
  title: string,
  children: React.ReactNode
}) {
  return (
      <Box>
        <Box position="relative" mb={2}>
          <Divider />
          <Box
              position="absolute"
              top="50%"
              left="20px"
              transform="translateY(-50%)"
              px={2}
              fontWeight="bold"
          >
          </Box>
        </Box>
        <Stack spacing={3}>
          {children}
        </Stack>
      </Box>
  )
}

// function Info({
//                 label,
//                 value,
//                 action
//               }: {
//   label: string,
//   value: string | null | undefined,
//   action?: React.ReactNode
// }) {
//   return (
//       <Flex justify="space-between" align="center">
//         <Box flex="1">
//           <Text fontWeight="bold">{label}:</Text>
//           <Text>{value ?? "—"}</Text>
//         </Box>
//         {action && (
//             <Box ml={4}>
//               {action}
//             </Box>
//         )}
//       </Flex>
//   )
// }
