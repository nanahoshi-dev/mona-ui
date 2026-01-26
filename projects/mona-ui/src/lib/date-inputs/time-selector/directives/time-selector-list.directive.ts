import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../../theme/services/theme.service";
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
        "[attr.tabindex]": "focused() ? 0 : -1"
    }
})
export class TimeSelectorListDirective implements TimeSelectorListVariantInput {
    readonly #itemHeight = computed(() => {
        const size = this.size();
        return size === "small" ? 32 : size === "medium" ? 36 : 40;
    });
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.focused();
        return timeSelectorListThemeVariants(theme)({ focused });
    });
    protected readonly listPadding = computed(() => {
        const itemHeight = this.#itemHeight();
        const popupHeight = this.popupHeight();
        return popupHeight / 2 - itemHeight / 2;
    });
    public readonly focused = input.required<boolean>();
    public readonly popupHeight = input.required<number>();
    public readonly size = input.required<TimeSelectorListVariantProps["size"]>();
}
