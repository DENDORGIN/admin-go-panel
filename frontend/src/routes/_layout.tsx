import { Flex, Spinner } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import Sidebar from "../components/Common/Sidebar"
import UserMenu from "../components/Common/UserMenu"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import { useSSE } from "../hooks/useSSE"
// import NotificationBell from "../components/Notification/Bell";

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const { isLoading } = useAuth()
  useSSE();


  return (
      <Flex maxW="large" h="auto" position="relative">
        <Sidebar />
        {/*<NotificationBell />*/}

        {isLoading ? (
            <Flex justify="center" align="center" height="100vh" width="full">
              <Spinner size="xl" color="ui.main" />
            </Flex>
        ) : (
            <Outlet />
        )}
        <UserMenu />
      </Flex>
  )
}
