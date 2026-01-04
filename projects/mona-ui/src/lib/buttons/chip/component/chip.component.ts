import { ChangeDetectionStrategy, Component, computed, inject, input, output } from "@angular/core";
import { CircleX, LucideAngularModule } from "lucide-angular";
import { chipThemeVariants, ChipVariantInputs, ChipVariantProps } from "../styles/chip.styles";
import { ThemeService } from "../../../theme/services/theme.service";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "mona-chip",
    templateUrl: "./chip.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideAngularModule],
    host: {
        "[class]": "classes()",
        "[class.mona-chip]": "true",
        "[attr.data-disabled]": "disabled() ? '' : undefined",
        "[attr.tabindex]": "disabled() ? -1 : tabindex()",
        "[attr.aria-disabled]": "disabled() ? true : undefined"
    }
})
export class ChipComponent implements ChipVariantInputs {
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.userClass();
        const variantClasses = chipThemeVariants(theme)({ look, rounded, size });
        return twMerge(variantClasses, userClass);
    });
    protected readonly iconSize = computed(() => {
        const size = this.size();
        switch (size) {
            case "small":
                return 13;
            case "medium":
                return 14;
            case "large":
                return 16;
            default:
                return 14;
        }
    });
    protected readonly removeIcon = CircleX;

    /**
     * @description Sets the disabled state of the chip.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the label of the chip.
     *
     * If the label is set, the chip will display the label instead of the content.
     */
    public readonly label = input("");

    /**
     * @description Sets the look of the chip.
     */
    public readonly look = input<ChipVariantProps["look"]>("default");

    /**
     * @description Sets the removable state of the chip.
     * If true, the chip will display a remove icon.
     */
    public readonly removable = input(false);

    /**
     * @description Emits when the {@link removable} is set to true and the remove icon is clicked.
     */
    public readonly remove = output<Event>();

    /**
     * @description Sets the rounded state of the chip.
     */
    public readonly rounded = input<ChipVariantProps["rounded"]>("full");

    /**
     * @description Sets the size of the chip.
     */
    public readonly size = input<ChipVariantProps["size"]>("medium");

    /**
     * @description Sets the tabindex of the chip.
     */
    public readonly tabindex = input<number | string>(0);
    public readonly userClass = input<string>("", { alias: "class" });
}
