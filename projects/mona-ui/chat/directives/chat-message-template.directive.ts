import { Directive } from "@angular/core";
import type { ChatMessageTemplateContext } from "../models/ChatTemplateContext";

/**
 * Template for each message's content, inside its bubble, in place of its text, such as text rendered from Markdown.
 * The message is the template's implicit value (`let-message`), with whether it's the user's own (`let-mine="mine"`).
 * The files sent with it, its status and the caret of a message that's streaming stay where they are.
 */
@Directive({
    selector: "ng-template[monaChatMessageTemplate]"
})
export class ChatMessageTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: ChatMessageTemplateDirective,
        _context: unknown
    ): _context is ChatMessageTemplateContext {
        return true;
    }
}
