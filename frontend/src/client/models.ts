export type Body_login_login_access_token = {
  grant_type?: string | null
  email: string
  password: string
  scope?: string
  client_id?: string | null
  client_secret?: string | null
}

// export type HTTPValidationError = {
//   detail?: Array<ValidationError>
// }

export type ItemCreate = {
  position: number
  title: string
  description?: string | null
  description_second?: string | null
  images?: File[]
  language: string
  item_url?: string | null
  category: string
  properties: Record<string, any>
  status: boolean
}

export type ItemPublic = {
  images: string | null
  title: string
  description?: string | null
  description_second?: string | null
  status: boolean
  id: string
  position: number
  language: string
  item_url: string
  category: string
  properties: Record<string, any>
  owner_id: string
}

export type ItemUpdate = {
  title?: string | null
  description?: string | null
  description_second?: string | null
  images?: File[] | null
  position: number
  language: string
  item_url?: string | null
  category: string
  properties: Record<string, any>
  status: boolean
}

export type ItemsPublic = {
  data: Array<ItemPublic>
  count: number
}

export type PostPublic = {
  images: string | null
  title: string
  description?: string | null
  status: boolean
  id: string
  position: number
  owner_id: string
}

export type PostCreate = {
  position: number
  title: string
  description?: string | null
  images?: File[]
  status: boolean
}

export type PostUpdate = {
  title?: string | null
  description?: string | null
  images?: File[] | null
  position: number
  status: boolean
}

export type PostsPublic = {
  data: Array<PostPublic>
  count: number
}

export type Message = {
  message: string
}

export type NewPassword = {
  token: string
  newPassword: string
}

export type Token = {
  access_token: string
  token_type?: string
}

export type UpdatePassword = {
  currentPassword: string
  newPassword: string
}

export type UserCreate = {
  email: string
  isActive?: boolean
  isSuperUser?: boolean
  fullName?: string | null
  password: string
}

export type UserPublic = {
  email: string
  isActive?: boolean
  isSuperUser?: boolean
  fullName?: string | null
  id: string
}

export type UserRegister = {
  email: string
  password: string
  fullName: string
}

export type UserUpdate = {
  email?: string | null
  isActive?: boolean
  isSuperUser?: boolean
  fullName?: string | null
  password?: string | null
}

export type UserUpdateMe = {
  fullName?: string | null
  email?: string | null
}

export type UsersPublic = {
  data: Array<UserPublic>
  count: number
}

export type ValidationError = {
  loc: Array<string | number>
  msg: string
  type: string
}

export type CalendarEventCreate = {
  title: string
  startDate: string
  endDate: string
  allDay: boolean
  color?: string | null
}

export type CalendarEventPublic = {
  ID: string
  title: string
  startDate: string
  endDate: string
  allDay: boolean
  color?: string | null
  user_id: string
}
