import { afterRenderEffect, computed, Directive, ElementRef, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { STEPPER_STYLE_STRATEGY, StepperVariantProps } from "../styles/stepper.styles";

@Directive({
    selector: "span[monaStepperIndicator]",
    host: {
        "[class]": "stepIndicatorClass()"
    }
})
export class StepperIndicatorDirective {
    #wasFocused = false;
    readonly #host = inject(ElementRef);
    readonly #styleStrategy = inject(STEPPER_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly stepIndicatorClass = computed(() => {
        const theme = this.#themeService.theme();
        const active = this.active();
        const focused = this.focused();
        const rounded = this.rounded();
        return this.#styleStrategy.resolve(theme).stepIndicator({ active, focused, rounded });
    });
    public readonly active = input.required<boolean>();
    public readonly focused = input.required<boolean>();
    public readonly rounded = input.required<StepperVariantProps["rounded"]>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                const focused = this.focused();
                if (focused && !this.#wasFocused) {
                    this.#host.nativeElement.focus();
                }
                this.#wasFocused = focused;
            }
        });
    }
}
