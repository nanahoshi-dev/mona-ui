import { Directive } from "@angular/core";

/**
 * Template for a chat with no messages, in place of "No messages yet", such as a greeting from an assistant. It sits in
 * the middle of the messages' space; the suggested replies stay below it.
 */
@Directive({
    selector: "ng-template[monaChatEmptyTemplate]"
})
export class ChatEmptyTemplateDirective {}
