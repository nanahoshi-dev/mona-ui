import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import {
    timeSelectorListThemeVariants,
    TimeSelectorListVariantInput,
    TimeSelectorListVariantProps
} from "../styles/time-selector.styles";

@Directive({
    selector: "ol[monaTimeSelectorList]",
    host: {
        role: "listbox",
        "[class]": "baseClass()",
        "[style.padding-top.px]": "listPadding()",
        "[style.padding-bottom.px]": "listPadding()",
        "[attr.tabindex]": "active() ? 0 : -1"
    }
})
export class TimeSelectorListDirective implements TimeSelectorListVariantInput {
    readonly #itemHeight = computed(() => {
        const size = this.size();
        return size === "small" ? 24 : size === "medium" ? 28 : 32; // TODO: Get rid of magic numbers
    });
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const size = this.size();
        return timeSelectorListThemeVariants(theme)({ size });
    });
    protected readonly listPadding = computed(() => {
        const itemHeight = this.#itemHeight();
        const popupHeight = this.popupHeight();
        return popupHeight / 2 - itemHeight / 2;
    });
    public readonly active = input.required<boolean>();
    public readonly popupHeight = input.required<number>();
    public readonly size = input.required<TimeSelectorListVariantProps["size"]>();
}
