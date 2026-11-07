import { Directive } from "@angular/core";

/**
 * Replaces the string `title` in the header's button with projected content. It can't hold controls, since it's inside
 * a button. The template has no context variables.
 */
@Directive({
    selector: "ng-template[monaExpansionPanelTitleTemplate]"
})
export class ExpansionPanelTitleTemplateDirective {}
