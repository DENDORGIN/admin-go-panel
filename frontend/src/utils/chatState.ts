// src/utils/chatState.ts
export let activeChatId: string | null = null;

export function setActiveChatId(id: string | null) {
    activeChatId = id;
}

export function getActiveChatId(): string | null {
    return activeChatId;
}