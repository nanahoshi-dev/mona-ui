import { Directive } from "@angular/core";

/**
 * Injects content beside the header's button, between the title and the toggle icon. Its controls are the application's
 * own: their clicks and keys don't reach the button, and they need their own accessible names. The template has no
 * context variables.
 */
@Directive({
    selector: "ng-template[monaExpansionPanelActionsTemplate]"
})
export class ExpansionPanelActionsTemplateDirective {}
