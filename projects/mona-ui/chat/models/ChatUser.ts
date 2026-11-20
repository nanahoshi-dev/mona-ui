/** Someone taking part in a chat: the user, or someone they're talking to, a person or an assistant. */
export interface ChatUser {
    /** A picture of them, shown beside their messages. Without one, their initials are. */
    readonly avatarUrl?: string;

    /** What tells them apart: two messages whose authors have the same `id` are from the same person. */
    readonly id: unknown;

    /** Their name, shown above their messages and read with each one. */
    readonly name: string;
}
