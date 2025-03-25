
export function getCurrentSubdomain(): string | null {
    const parts = window.location.hostname.split(".")
    return parts.length > 1 ? parts[0] : null
}

export function redirectToSubdomain(domain: string, path: string = "/") {
    const port = window.location.port
    window.location.href = `http://${domain}.localhost:${port}${path}`
}
