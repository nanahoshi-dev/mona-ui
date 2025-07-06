import { Directive, ElementRef, inject } from "@angular/core";

/**
 * @internal
 */
@Directive({
    selector: "span[monaSliderTick]"
})
export class SliderTickDirective {
    public readonly host = inject<ElementRef<HTMLSpanElement>>(ElementRef);
}
