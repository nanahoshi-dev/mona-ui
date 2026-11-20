import type { ChatUser } from "./ChatUser";

/** A file sent with a message. */
export interface ChatAttachment {
    /** The file's name. */
    readonly name: string;

    /** The file's size in bytes, shown after its name. */
    readonly size?: number;

    /** The file's media type, such as `"image/png"`. An image with a `url` shows as a picture. */
    readonly type?: string;

    /** Where to get the file. With it, the file's name is a link to it. */
    readonly url?: string;
}

/**
 * Where a message of the user's stands: `"sending"`, shown faded with "Sending" under it, `"sent"`, or `"failed"`,
 * with "Not sent" and a Retry button under it.
 */
export type ChatMessageStatus = "failed" | "sending" | "sent";

/** A message in a chat. */
export interface ChatMessage {
    /** Files sent with the message, listed under its text. */
    readonly attachments?: readonly ChatAttachment[];

    /** Who sent it. A message whose author has the user's `id` is the user's own. */
    readonly author: ChatUser;

    /**
     * What identifies the message, so one that's replaced with a copy, as a reply streaming in is, stays the same
     * message: it keeps its place, and is announced once. Without it, a message is its own identity.
     */
    readonly id?: unknown;

    /** Where a message of the user's stands. A message without one has been sent. */
    readonly status?: ChatMessageStatus;

    /**
     * Whether the message's text is still coming in, as a reply from an assistant streams. It shows a caret at the end,
     * and is announced when it's done. While a message streams, the Send button stops it.
     */
    readonly streaming?: boolean;

    /** What it says. Line breaks show as written. */
    readonly text?: string;

    /** When it was sent, shown under the last message of a run and used to put the day above the first. */
    readonly timestamp?: Date;
}
