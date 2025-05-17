import { Flex, Spinner, useToast } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import Sidebar from "../components/Common/Sidebar"
import UserMenu from "../components/Common/UserMenu"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import { useNotificationSocket } from "../hooks/useNotificationSocket"

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
  const toast = useToast()

  // 🔔 Підключення глобального Notification WebSocket
  useNotificationSocket((msg) => {
    toast({
      position: 'top-right',
      title: msg.payload.title,
      description: msg.payload.body,
      status: "info",
      duration: 5000,
      isClosable: true,
      variant: "left-accent",
    });
  });


  return (
      <Flex maxW="large" h="auto" position="relative">
        <Sidebar />
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
