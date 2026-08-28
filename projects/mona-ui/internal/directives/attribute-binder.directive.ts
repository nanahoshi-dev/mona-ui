import { Directive, effect, ElementRef, inject, input, Renderer2 } from "@angular/core";
import { AttributeConfig } from "../models/AttributeConfig";

@Directive({
    selector: "[monaAttributeBinder]"
})
export class AttributeBinderDirective {
    readonly #element = inject(ElementRef);
    readonly #previousKeys = new Set<string>();
    readonly #renderer = inject(Renderer2);
    public readonly attributes = input<AttributeConfig>({}, { alias: "monaAttributeBinder" });

    public constructor() {
        effect(() => {
            const attributes = this.attributes();
            const nextKeys = new Set(Object.keys(attributes));

            for (const prevKey of this.#previousKeys) {
                if (!nextKeys.has(prevKey)) {
                    this.#renderer.removeAttribute(this.#element.nativeElement, prevKey);
                }
            }

            for (const [key, value] of Object.entries(attributes)) {
                if (value == null || value === false) {
                    this.#renderer.removeAttribute(this.#element.nativeElement, key);
                } else {
                    const attributeValue = typeof value === "boolean" ? String(value) : value;
                    this.#renderer.setAttribute(this.#element.nativeElement, key, attributeValue as string);
                }
            }

            this.#previousKeys.clear();
            for (const key of nextKeys) {
                this.#previousKeys.add(key);
            }
        });
    }
}
