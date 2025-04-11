import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  useBreakpointValue
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaUserAstronaut } from "react-icons/fa"
import { FiLogOut, FiUser } from "react-icons/fi"

import ThemeToggleButton from "../../components/Common/ThemeToggleButton"
import useAuth from "../../hooks/useAuth"

const UserMenu = () => {
  const { user: currentUser, logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }
    // визначаємо, чи мобільна версія
  const isMobile = useBreakpointValue({ base: true, md: false })

    return (
        <>
            {/* Мобільна версія — тільки перемикач теми */}
            {isMobile && (
                <Box position="fixed" top={4} right={4} zIndex={1000}>
                    <ThemeToggleButton />
                </Box>
            )}

            {/* Десктопна версія — UserMenu + перемикач теми */}
            {!isMobile && (
                <>
                    <Box position="fixed" top={4} right={20} zIndex={1000}>
                        <ThemeToggleButton />
                    </Box>
                    <Box position="fixed" top={4} right={4} zIndex={1000}>
                        <Menu>
                            <MenuButton
                                as={IconButton}
                                aria-label="User menu"
                                icon={
                                    currentUser?.avatar ? (
                                        <Avatar size="md" src={currentUser.avatar} />
                                    ) : (
                                        <FaUserAstronaut color="white" fontSize="18px" />
                                    )
                                }
                                bg="ui.main"
                                isRound
                                data-testid="user-menu"
                            />
                            <MenuList>
                                <MenuItem icon={<FiUser fontSize="18px" />} as={Link} to="settings">
                                    My profile
                                </MenuItem>
                                <MenuItem
                                    icon={<FiLogOut fontSize="18px" />}
                                    onClick={handleLogout}
                                    color="ui.danger"
                                    fontWeight="bold"
                                >
                                    Log out
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </Box>
                </>
            )}
        </>
    )
}

export default UserMenu
