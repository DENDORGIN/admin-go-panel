import { OpenAPI } from "./OpenAPI"

import { getApiUrl } from "../../utils/urls"

export const updateOpenApiConfig = () => {
    const token = localStorage.getItem("access_token") || ""
    OpenAPI.BASE = getApiUrl()
    OpenAPI.TOKEN = async () => token
}


