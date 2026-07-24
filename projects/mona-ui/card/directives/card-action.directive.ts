import { Directive, inject, TemplateRef } from "@angular/core";

@Directive({
    selector: "[monaCardAction]"
})
export class CardActionDirective {
    public readonly templateRef = inject(TemplateRef);
}
