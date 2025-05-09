import {
  Container,
  Flex,
  Link,
  Spinner,
  Text,
  Td,
  Table,
  Tr,
  Tbody
} from "@chakra-ui/react"
import { ArrowBackIcon } from "@chakra-ui/icons"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { EmployeeService } from "../../../client"
import { useNavigate } from "@tanstack/react-router"
import ImageGallery from "../../../components/Modals/ModalImageGallery.tsx";

export const Route = createFileRoute("/_layout/user/$userId")({
  component: UserDetails,
})

function UserDetails() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()

  const { data: user, isLoading, error } = useQuery({
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
    return <Text textAlign="center">Користувача не знайдено або сталася помилка.</Text>

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

        <Table variant="simple" mt={6}>
          <Tbody>
            <Tr>
              <Td colSpan={2}>
                <ImageGallery
                    images={Array.isArray(user.avatar) ? user.avatar : user.avatar ? [user.avatar] : []}
                    title={user.fullName ?? "_"}
                    numberOfImages={1}
                />
              </Td>
            </Tr>
            <Tr>
              <Td fontWeight="bold">Email</Td><Td>{user.email}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Активний</Td><Td>{user.isActive ? "Так" : "Ні"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Адміністратор</Td><Td>{user.isAdmin ? "Так" : "Ні"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Суперкористувач</Td><Td>{user.isSuperUser ? "Так" : "Ні"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Телефон 1</Td><Td>{user.phone_number_1 || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Телефон 2</Td><Td>{user.phone_number_2 || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Компанія</Td><Td>{user.company || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Посада</Td><Td>{user.position || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Тип угоди</Td><Td>{user.condition_type || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Зарплата</Td><Td>{user.salary || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Адреса</Td><Td>{user.address || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Дата початку</Td><Td>{user.date_start || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Дата завершення</Td><Td>{user.date_end || "—"}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Створено</Td><Td>{new Date(user.created_at).toLocaleString()}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Оновлено</Td><Td>{new Date(user.updated_at).toLocaleString()}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Хто створив</Td><Td>{user.whu_created_by_acron}</Td></Tr>
            <Tr>
              <Td fontWeight="bold">Хто оновив</Td><Td>{user.whu_updated_by_acron || "—"}</Td></Tr>
          </Tbody>
        </Table>
      </Container>
  )
}
