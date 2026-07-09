import { computed, DestroyRef, Directive, effect, ElementRef, inject, input, signal } from "@angular/core";
import { rxTimeout } from "@nanahoshi/mona-ui/internal";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import {
    timeSelectorListItemThemeVariants,
    TimeSelectorListItemVariantInput,
    TimeSelectorListItemVariantProps
} from "../styles/time-selector.styles";

@Directive({
    selector: "li[monaTimeSelectorItem]",
    host: {
        role: "option",
        "[attr.aria-selected]": "selected()",
        "[attr.data-value]": "value()",
        "[class]": "baseClass()"
    }
})
export class TimeSelectorItemDirective implements TimeSelectorListItemVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #host = inject(ElementRef<HTMLLIElement>);
    readonly #scrollBehavior = signal<"auto" | "instant">("instant");
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const selected = this.selected();
        const size = this.size();
        return timeSelectorListItemThemeVariants(theme)({ selected, size });
    });
    public readonly selected = input.required<boolean>();
    public readonly size = input.required<TimeSelectorListItemVariantProps["size"]>();
    public readonly value = input.required<number | string>();

    public constructor() {
        effect(() => {
            const selected = this.selected();
            rxTimeout(this.#destroyRef, () => {
                if (selected) {
                    this.#host.nativeElement.scrollIntoView({ block: "center", behavior: this.#scrollBehavior() });
                }
                if (this.#scrollBehavior() === "instant") {
                    this.#scrollBehavior.set("auto");
                }
            });
        });
    }
}
