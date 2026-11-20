/*
 * Public API Surface of @nanahoshi/mona-ui/chat
 */

export { ChatComponent } from "./components/chat/chat.component";
export { ChatAttachmentTemplateDirective } from "./directives/chat-attachment-template.directive";
export { ChatEmptyTemplateDirective } from "./directives/chat-empty-template.directive";
export { ChatMessageTemplateDirective } from "./directives/chat-message-template.directive";
export type { ChatAttachment, ChatMessage, ChatMessageStatus } from "./models/ChatMessage";
export type { ChatSendEvent } from "./models/ChatSendEvent";
export type { ChatAttachmentTemplateContext, ChatMessageTemplateContext } from "./models/ChatTemplateContext";
export type { ChatUser } from "./models/ChatUser";
export { CHAT_DEFAULT_MESSAGES } from "./i18n/chat.default-messages";
