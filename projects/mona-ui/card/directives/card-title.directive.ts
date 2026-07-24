import { Directive, inject, input, TemplateRef } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";

@Directive({
    selector: "[monaCardTitle]"
})
export class CardTitleDirective {
    public readonly templateRef = inject(TemplateRef);
    public readonly userClass = input<ClassInputType, string>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
