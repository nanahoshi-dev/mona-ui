import { booleanAttribute, Component, computed, inject, input } from "@angular/core";
import { LucideDynamicIcon, LucideLoader } from "@lucide/angular";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { twMerge } from "tailwind-merge";
import type { SpinnerAppearance } from "../../models/SpinnerAppearance";
import type { SpinnerSize } from "../../models/SpinnerSize";
import { SPINNER_DEFAULT_MESSAGES } from "../../i18n/spinner.default-messages";
import { spinnerThemeVariants, type SpinnerVariantInput } from "../../styles/spinner.styles";

/**
 * @description
 * An indeterminate loading indicator primitive for communicating ongoing activity.
 * Supports multiple appearances and standard sizes. It's a named image, so it's found when a screen reader reaches it,
 * not announced. To announce loading, use `SpinnerService` or a live region that's already on the page.
 */
@Component({
    selector: "mona-spinner",
    templateUrl: "./spinner.component.html",
    styleUrls: ["./spinner.component.css"],
    imports: [LucideDynamicIcon],
    host: {
        "[attr.aria-hidden]": "decorative() ? 'true' : null",
        "[attr.aria-label]": "decorative() ? null : (ariaLabel() || messages().loading)",
        "[attr.role]": "decorative() ? null : 'img'",
        "[class]": "baseClass()"
    }
})
export class SpinnerComponent implements SpinnerVariantInput {
    readonly #i18n = inject(MonaI18nService);
    protected readonly baseClass = computed(() => {
        const variantClass = spinnerThemeVariants({ size: this.size() });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly loaderIcon = LucideLoader;
    protected readonly messages = this.#i18n.componentMessages("spinner", SPINNER_DEFAULT_MESSAGES);
    protected readonly pixelSize = computed(() => {
        switch (this.size()) {
            case "small":
                return 12;
            case "large":
                return 24;
            case "medium":
            default:
                return 16;
        }
    });

    /**
     * @description Visual appearance of the spinner animation.
     * @default "default"
     */
    public readonly appearance = input<SpinnerAppearance>("default");

    /**
     * @description Accessible name of the spinner when it is not decorative.
     * When not set, falls back to the localized loading text.
     * @default undefined
     */
    public readonly ariaLabel = input<string | undefined>(undefined, { alias: "aria-label" });


    /**
     * @description When `true`, removes the `img` role and hides the spinner from assistive technology with `aria-hidden="true"`.
     * Useful when visible text says the same thing, or a parent element already manages loading semantics (such as
     * `aria-busy="true"` on a button).
     * @default false
     */
    public readonly decorative = input(false, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the dimensions of the indicator.
     * @default "medium"
     */
    public readonly size = input<SpinnerSize>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
