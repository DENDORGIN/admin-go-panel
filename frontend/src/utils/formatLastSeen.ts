

export function formatLastSeen(lastSeenAt?: string | null): string {
    if (!lastSeenAt) return "Невідомо";

    const lastSeen = new Date(lastSeenAt).getTime();
    const now = Date.now();
    const diffMs = now - lastSeen;

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Щойно";
    if (minutes < 60) return `${minutes} хв тому`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} год тому`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} дн${days === 1 ? "ь" : "і"} тому`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} міс тому`;

    const years = Math.floor(months / 12);
    return `${years} р${years === 1 ? "ік" : "оки"} тому`;
}
