import { OpenAPI } from "./OpenAPI"

export const updateOpenApiConfig = () => {
    const token = localStorage.getItem("access_token")
    const domain = localStorage.getItem("tenant") || "localhost"
    const backendPort = import.meta.env.DEV ? ":5180" : ""
    OpenAPI.TOKEN = async () => token || ""
    OpenAPI.BASE = `http://${domain}.localhost${backendPort}`
}

