import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { alertActionsThemeVariants } from "../styles/alert.styles";

/**
 * @description Marks an element inside `<mona-alert>` as its row of actions, such as a Retry button. The alert places it
 * below its text, and it lays out its buttons in a wrapping row.
 */
@Directive({
    selector: "[monaAlertActions]",
    host: {
        "[class]": "baseClass()"
    }
})
export class AlertActionsDirective {
    protected readonly baseClass = computed(() => twMerge(alertActionsThemeVariants(), this.userClass()));

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
