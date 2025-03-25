
export function getCurrentSubdomain(): string | null {
    const parts = window.location.hostname.split(".")
    return parts.length > 1 ? parts[0] : null
}

export function redirectToSubdomain(domain: string, path: string = "/") {
    const isDev = import.meta.env.DEV

    if (isDev) {
        const port = window.location.port
        window.location.href = `http://${domain}.localhost:${port}${path}`
    } else {
        // продакшен
        const baseDomain = import.meta.env.VITE_APP_DOMAIN || "dbgone.com"
        window.location.href = `https://${domain}.${baseDomain}${path}`
    }
}
