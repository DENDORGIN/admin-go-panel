



export function getTenantSubdomain(): string {
    const hostname = window.location.hostname; // ex: denborgin.localhost

    // IP-адреса або чистий localhost
    if (
        hostname === "localhost" ||
        /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || // 127.0.0.1
        hostname === "[::1]" // IPv6 localhost
    ) {
        return "localhost"
    }

    const parts = hostname.split(".")

    // denborgin.localhost → повертаємо denborgin
    if (parts.length === 2 && parts[1] === "localhost") {
        return parts[0]
    }

    // denborgin.example.com → повертаємо denborgin
    if (parts.length >= 3) {
        return parts[0]
    }

    return "default"
}


export function getApiUrl(): string {
    const base = import.meta.env.VITE_API_DOMAIN
    const tenant = getTenantSubdomain()

    if (tenant === "localhost") {
        return base // http://localhost:5180
    }

    return base.replace("://", `://${tenant}.`)
}

export function getWsUrl(path: string, params: Record<string, string> = {}): string {
    const base = import.meta.env.VITE_WS_URL
    const tenant = getTenantSubdomain()

    const wsBase = tenant === "localhost"
        ? base // ws://localhost:5180
        : base.replace("://", `://${tenant}.`) // wss://tenant.domain.com

    const query = new URLSearchParams(params).toString()
    return `${wsBase}/ws/${path}?${query}`
}

console.log("Tenant:", getTenantSubdomain())


export function getSseUrl(path: string, params: Record<string, string> = {}): string {
    const base = import.meta.env.VITE_API_DOMAIN; // наприклад, http://localhost:5180 або https://api.domain.com
    const tenant = getTenantSubdomain();

    const sseBase =
        tenant === "localhost"
            ? base // http://localhost:5180
            : base.replace("://", `://${tenant}.`);

    const query = new URLSearchParams(params).toString();
    return `${sseBase}/v1/sse/${path}${query ? `?${query}` : ""}`;
}
