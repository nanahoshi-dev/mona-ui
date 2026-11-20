import { Directive } from "@angular/core";
import type { ChatAttachmentTemplateContext } from "../models/ChatTemplateContext";

/**
 * Template for each file sent with a message, in place of its picture, name and size, such as a preview of a document.
 * The file is the template's implicit value (`let-attachment`), with its message (`let-message="message"`) and whether
 * that's the user's own (`let-mine="mine"`).
 */
@Directive({
    selector: "ng-template[monaChatAttachmentTemplate]"
})
export class ChatAttachmentTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: ChatAttachmentTemplateDirective,
        _context: unknown
    ): _context is ChatAttachmentTemplateContext {
        return true;
    }
}
