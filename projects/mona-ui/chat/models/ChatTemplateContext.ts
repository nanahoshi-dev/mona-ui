import type { ChatAttachment, ChatMessage } from "./ChatMessage";

/** The context of a `monaChatMessageTemplate`: the message, as `let-message`. */
export interface ChatMessageTemplateContext {
    /** The message (`let-message`). */
    readonly $implicit: ChatMessage;
    /** Whether it's the user's own message (`let-mine="mine"`). */
    readonly mine: boolean;
}

/** The context of a `monaChatAttachmentTemplate`: the file, as `let-attachment`. */
export interface ChatAttachmentTemplateContext {
    /** The file (`let-attachment`). */
    readonly $implicit: ChatAttachment;
    /** The message it was sent with (`let-message="message"`). */
    readonly message: ChatMessage;
    /** Whether it's on the user's own message (`let-mine="mine"`). */
    readonly mine: boolean;
}
