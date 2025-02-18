import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { ChipVariantInputs, ChipVariantProps, chipVariants } from "mona-ui/buttons/chip/chip.style";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "mona-chip",
    templateUrl: "./chip.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "classes()",
        "[class.mona-chip]": "true",
        "[attr.data-disabled]": "disabled() ? '' : undefined",
        "[attr.tabindex]": "disabled() ? -1 : tabindex()",
        "[attr.aria-disabled]": "disabled() ? true : undefined"
    }
})
export class ChipComponent implements ChipVariantInputs {
    protected readonly classes = computed(() => {
        const look = this.look();
        const userClass = this.userClass();
        const variantClasses = chipVariants({ look });
        return twMerge(variantClasses, userClass);
    });

    /**
     * Sets the disabled state of the chip.
     */
    public readonly disabled = input(false);

    /**
     * Sets the label of the chip.
     *
     * If the label is set, the chip will display the label instead of the content.
     */
    public readonly label = input("");

    /**
     * Sets the look of the chip.
     */
    public readonly look = input<ChipVariantProps["look"]>("default");

    /**
     * Sets the removable state of the chip.
     * If true, the chip will display a remove icon.
     */
    public readonly removable = input(false);

    /**
     * Emits when the {@link removable} is set to true and the remove icon is clicked.
     */
    public readonly remove = output<Event>();

    /**
     * Sets the tabindex of the chip.
     */
    public readonly tabindex = input<number | string>(0);
    public readonly userClass = input<string>("", { alias: "class" });
}
