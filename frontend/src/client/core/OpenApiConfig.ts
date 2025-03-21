import { OpenAPI } from "./OpenAPI"

export const updateOpenApiConfig = () => {
    const tenant = localStorage.getItem("tenant")
    const token = localStorage.getItem("access_token")

    OpenAPI.BASE = tenant
        ? `https://${tenant}.denborgin.com`
        : "https://denborgin.com"

    OpenAPI.TOKEN = token || undefined
}

// Викликати одразу при старті додатку
updateOpenApiConfig()
