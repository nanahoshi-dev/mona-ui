import { Directive, inject, TemplateRef } from "@angular/core";

@Directive({
    selector: "[monaCardDescription]"
})
export class CardDescriptionDirective {
    public readonly templateRef = inject(TemplateRef);
}
