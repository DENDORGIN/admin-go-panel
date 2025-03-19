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
import useAuth from "../../hooks/useAuth.ts";

interface ActionsMenuProps {
  type: "User" | "Item" | "Post"
  value: ItemPublic | PostPublic | UserPublic
  disabled?: boolean
}

const ActionsMenu = ({ type, value, disabled }: ActionsMenuProps) => {
  const editModal = useDisclosure()
  const deleteModal = useDisclosure()
  const { user } = useAuth();

  // Отримуємо ID власника залежно від типу
  const ownerId = "owner_id" in value ? value.owner_id : ("ID" in value ? value.ID : null);
  const isOwner = user?.ID === ownerId;

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
                isDisabled={!isOwner} // Блокуємо, якщо не власник
            >
              Edit {type}
            </MenuItem>
            {/* Видалення */}
            <MenuItem
                onClick={deleteModal.onOpen}
                icon={<FiTrash fontSize="16px" />}
                color="red.500"
                isDisabled={!isOwner} // Блокуємо, якщо не власник
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
                {...(isOwner ? {} : { isDisabled: true })}
            />
        )}
        {type === "Post" && (
            <EditPost
                post={value as PostPublic}
                isOpen={editModal.isOpen}
                onClose={editModal.onClose}
                {...(isOwner ? {} : { isDisabled: true })}
            />
        )}

        {/* Модальне вікно для видалення */}
        <Delete
            type={type}
            id={("ID" in value && value.ID) ? String(value.ID) : ""}
            isOpen={deleteModal.isOpen}
            onClose={deleteModal.onClose}
            {...(isOwner ? {} : { isDisabled: true })}
        />
      </>
  )
}

export default ActionsMenu
