import { Directive, inject, TemplateRef } from "@angular/core";

@Directive({
    selector: "[monaCardContent]"
})
export class CardContentDirective {
    public readonly templateRef = inject(TemplateRef);
}
