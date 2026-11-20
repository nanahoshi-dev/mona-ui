/** What the user sends: their message's text, trimmed, and the files they attached to it. */
export interface ChatSendEvent {
    /** The files attached to the message, in the order they were picked. */
    readonly files: readonly File[];

    /** The message's text, trimmed. It's empty for a message of files alone. */
    readonly text: string;
}
