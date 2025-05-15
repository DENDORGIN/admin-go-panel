import { EditableUserFields } from "./useUpdateUser"

// USER_INFO_FIELDS — лише string-поля
export const USER_INFO_FIELDS: (keyof Pick<
    EditableUserFields,
    "fullName" | "acronym" | "email" | "phone_number_1" | "phone_number_2" | "address"
>)[] = [
    "fullName",
    "acronym",
    "email",
    "phone_number_1",
    "phone_number_2",
    "address",
]

// COMPANY_INFO_FIELDS — для майбутньої секції Company
export const COMPANY_INFO_FIELDS: (keyof Pick<
    EditableUserFields,
    "company" | "position" | "condition_type" | "salary" | "date_start" | "date_end"
>)[] = [
    "company",
    "position",
    "condition_type",
    "salary",
    "date_start",
    "date_end",
]

// EXTRA_DATA_FIELDS — тільки ключ для об’єкта
export const EXTRA_DATA_FIELDS: (keyof Pick<
    EditableUserFields,
    "extra_data"
>)[] = ["extra_data"]
