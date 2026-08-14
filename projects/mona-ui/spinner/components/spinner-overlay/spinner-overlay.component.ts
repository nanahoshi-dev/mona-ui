import { Component, computed, input, output } from "@angular/core";
import type { SpinnerAppearance } from "../../models/SpinnerAppearance";
import type { SpinnerSize } from "../../models/SpinnerSize";
import { spinnerOverlayThemeVariants, type SpinnerOverlayVariantInput } from "../../styles/spinner-overlay.styles";
import { SpinnerComponent } from "../spinner/spinner.component";

/**
 * @description
 * Internal overlay component managed exclusively by `SpinnerService`.
 * Hosts a decorative `SpinnerComponent`, status message, and optional cancellation control.
 */
@Component({
    selector: "mona-spinner-overlay",
    templateUrl: "./spinner-overlay.component.html",
    imports: [SpinnerComponent],
    host: {
        "[class]": "baseClass()",
        "[style.z-index]": "effectiveZIndex()"
    }
})
export class SpinnerOverlayComponent implements SpinnerOverlayVariantInput {
    protected readonly baseClass = computed(() => {
        return spinnerOverlayThemeVariants({ fullPage: this.fullPage() });
    });
    protected readonly effectiveZIndex = computed(() => {
        const customZIndex = this.zIndex();
        if (customZIndex !== undefined) {
            return customZIndex;
        }
        return this.fullPage() ? 50 : 1;
    });

    /**
     * @description Visual appearance of the nested spinner animation.
     * @default "default"
     */
    public readonly appearance = input<SpinnerAppearance>("default");

    /**
     * @description Emits when the consumer clicks the cancellation action button.
     */
    public readonly cancel = output<void>();

    /**
     * @description Whether the cancellation button is displayed in the overlay.
     * @default false
     */
    public readonly cancellable = input<boolean>(false);

    /**
     * @description Label text displayed inside the cancellation button.
     * @default "Cancel"
     */
    public readonly cancelText = input<string>("Cancel");

    /**
     * @description Whether the overlay is fixed across the viewport or absolute within a target container.
     * @default false
     */
    public readonly fullPage = input<boolean>(false);

    /**
     * @description Size preset passed to the nested spinner.
     * @default "medium"
     */
    public readonly size = input<SpinnerSize>("medium");

    /**
     * @description Status text displayed below the spinner indicator.
     * @default undefined
     */
    public readonly text = input<string | undefined>(undefined);

    /**
     * @description Custom z-index value for unusual stacking contexts.
     * @default undefined
     */
    public readonly zIndex = input<number | undefined>(undefined);

    protected onCancel(): void {
        this.cancel.emit();
    }
}
