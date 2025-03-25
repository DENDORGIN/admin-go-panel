import { OpenAPI } from "./OpenAPI"

export const updateOpenApiConfig = () => {
    const token = localStorage.getItem("access_token") || ""
    const domain = localStorage.getItem("tenant") || "localhost"

    const isDev = import.meta.env.DEV
    const port = isDev ? ":5180" : ""
    const protocol = isDev ? "http" : "https"

    const baseUrl = isDev
        ? `${protocol}://${domain}.localhost${port}`
        : `${protocol}://${domain}.dbgone.com`

    OpenAPI.TOKEN = async () => token
    OpenAPI.BASE = baseUrl
}


