import { Component, computed, input } from "@angular/core";
import { LucideDynamicIcon, LucideLoader } from "@lucide/angular";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import type { SpinnerAppearance } from "../../models/SpinnerAppearance";
import type { SpinnerSize } from "../../models/SpinnerSize";
import { spinnerThemeVariants, type SpinnerVariantInput } from "../../styles/spinner.styles";

/**
 * @description
 * An indeterminate loading indicator primitive for communicating ongoing activity.
 * Supports multiple appearances, standard sizes, and accessible status announcements.
 */
@Component({
    selector: "mona-spinner",
    templateUrl: "./spinner.component.html",
    styleUrls: ["./spinner.component.css"],
    imports: [LucideDynamicIcon],
    host: {
        "[attr.aria-hidden]": "decorative() ? 'true' : null",
        "[attr.aria-label]": "decorative() ? null : (ariaLabel() || 'Loading')",
        "[attr.role]": "decorative() ? null : 'status'",
        "[class]": "baseClass()"
    }
})
export class SpinnerComponent implements SpinnerVariantInput {
    protected readonly baseClass = computed(() => {
        const variantClass = spinnerThemeVariants({ size: this.size() });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly loaderIcon = LucideLoader;
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
     * @description Accessible text announced by assistive technology when the spinner is not decorative.
     * @default "Loading"
     */
    public readonly ariaLabel = input<string>("Loading", { alias: "aria-label" });

    /**
     * @description When `true`, removes the `status` role and hides the spinner from assistive technology with `aria-hidden="true"`.
     * Useful when a parent element already manages loading semantics (such as `aria-busy="true"` on a button).
     * @default false
     */
    public readonly decorative = input<boolean>(false);

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
