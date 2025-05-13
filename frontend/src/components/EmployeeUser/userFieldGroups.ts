import { EditableUserFields } from "./useUpdateUser"

export const USER_INFO_FIELDS: (keyof EditableUserFields)[] = [
    "fullName",
    "acronym",
    "email",
    "phone_number_1",
    "phone_number_2",
    "address",
]

export const COMPANY_INFO_FIELDS: (keyof EditableUserFields)[] = [
    "company",
    "position",
    "condition_type",
    "salary",
    "date_start",
    "date_end",
]

export const EXTRA_DATA_FIELDS: (keyof EditableUserFields)[] = [
    "extra_data", // якщо це весь об'єкт додаткових полів
]
