import { computed, DestroyRef, Directive, effect, ElementRef, inject, input } from "@angular/core";
import { rxTimeout } from "../../../common/utils/rxTimeout";
import { ThemeService } from "../../../theme/services/theme.service";
import { timeSelectorListItemThemeVariants } from "../styles/time-selector.styles";

@Directive({
    selector: "li[monaTimeSelectorItem]",
    host: {
        "[attr.data-value]": "value()",
        "[class]": "baseClass()"
    }
})
export class TimeSelectorItemDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #host = inject(ElementRef<HTMLLIElement>);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const selected = this.selected();
        return timeSelectorListItemThemeVariants(theme)({ selected, size: "medium" });
    });
    public readonly selected = input.required<boolean>();
    public readonly value = input.required<number | string>();

    public constructor() {
        effect(() => {
            const selected = this.selected();
            rxTimeout(this.#destroyRef, () => {
                if (selected) {
                    this.#host.nativeElement.scrollIntoView({ block: "center", behavior: "auto" });
                }
            });
        });
    }
}
