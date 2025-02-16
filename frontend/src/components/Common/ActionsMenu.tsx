import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash } from "react-icons/fi"

import type { ItemPublic, PostPublic, UserPublic } from "../../client"
import EditUser from "../Admin/EditUser"
import EditPost from "../Blog/EditPost"
import EditItem from "../Items/EditItem"
import Delete from "./DeleteAlert"

interface ActionsMenuProps {
  type: "User" | "Item" | "Post" // Обмежуємо типи для чіткої типізації
  value: ItemPublic | PostPublic | UserPublic
  disabled?: boolean
}

const ActionsMenu = ({ type, value, disabled }: ActionsMenuProps) => {
  const editModal = useDisclosure() // Одне useDisclosure для редагування
  const deleteModal = useDisclosure() // Одне useDisclosure для видалення

  return (
    <>
      <Menu>
        <MenuButton
          isDisabled={disabled}
          as={Button}
          rightIcon={<BsThreeDotsVertical />}
          variant="unstyled"
        />
        <MenuList>
          {/* Редагування */}
          <MenuItem
            onClick={editModal.onOpen}
            icon={<FiEdit fontSize="16px" />}
          >
            Edit {type}
          </MenuItem>
          {/* Видалення */}
          <MenuItem
            onClick={deleteModal.onOpen}
            icon={<FiTrash fontSize="16px" />}
            color="red.500" // Стандартний колір Chakra UI для попереджень
          >
            Delete {type}
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Модальне вікно для редагування */}
      {type === "User" && (
        <EditUser
          user={value as UserPublic}
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
        />
      )}
      {type === "Item" && (
        <EditItem
          item={value as ItemPublic}
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
        />
      )}
      {type === "Post" && (
        <EditPost
          post={value as PostPublic}
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
        />
      )}

      {/* Модальне вікно для видалення */}
      <Delete
        type={type}
        // @ts-ignore
        id={"ID" in value ? value.ID : undefined}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
      />
    </>
  )
}

export default ActionsMenu
