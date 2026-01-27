import { Directive, effect, ElementRef, inject, input, Renderer2 } from "@angular/core";
import { AttributeConfig } from "../models/AttributeConfig";

@Directive({
    selector: "[monaAttributeBinder]"
})
export class AttributeBinderDirective {
    readonly #element = inject(ElementRef);
    readonly #renderer = inject(Renderer2);
    public readonly attributes = input<AttributeConfig>({}, { alias: "monaAttributeBinder" });

    public constructor() {
        effect(() => {
            const attributes = this.attributes();
            for (const [key, value] of Object.entries(attributes)) {
                if (value == null || value === false) {
                    this.#renderer.removeAttribute(this.#element.nativeElement, key);
                } else {
                    const attributeValue = typeof value === "boolean" ? String(value) : value;
                    this.#renderer.setAttribute(this.#element.nativeElement, key, attributeValue as string);
                }
            }
            console.log(attributes);
        });
    }
}
