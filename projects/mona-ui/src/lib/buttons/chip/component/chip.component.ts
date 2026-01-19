import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    output,
    TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CircleX, LucideAngularModule } from "lucide-angular";
import { filter, fromEvent } from "rxjs";
import { ButtonDirective } from "../../button/directives/button.directive";
import { ChipPrefixTemplateDirective } from "../directives/chip-prefix-template.directive";
import { chipThemeVariants, ChipVariantInputs, ChipVariantProps } from "../styles/chip.styles";
import { ThemeService } from "../../../theme/services/theme.service";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "mona-chip",
    templateUrl: "./chip.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideAngularModule, ButtonDirective, NgTemplateOutlet],
    host: {
        "[class]": "baseClass()",
        "[attr.tabindex]": "effectiveTabIndex()",
        "[attr.aria-disabled]": "disabled() ? 'true' : undefined",
        "[attr.role]": "role()",
        "[attr.aria-checked]": "ariaChecked()",
        "[attr.aria-label]": "effectiveAriaLabel()"
    }
})
export class ChipComponent implements ChipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #themeService = inject(ThemeService);

    protected readonly ariaChecked = computed(() => {
        if (this.selected() !== undefined) {
            return this.selected() ? "true" : "false";
        }
        return undefined;
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const selected = this.selected();
        const userClass = this.userClass();
        const variantClasses = chipThemeVariants(theme)({ disabled, look, rounded, size, selected });
        return twMerge(variantClasses, userClass);
    });
    protected readonly effectiveAriaLabel = computed(() => {
        const explicitLabel = this.ariaLabel();
        if (explicitLabel) {
            return explicitLabel;
        }
        const label = this.label();
        if (label) {
            return label;
        }
        return undefined;
    });
    protected readonly effectiveTabIndex = computed(() => {
        if (this.disabled()) {
            return -1;
        }
        const explicitTabindex = this.tabindex();
        if (explicitTabindex != null) {
            return explicitTabindex;
        }
        if (this.toggleable() || this.removable() || this.selected() != null) {
            return 0;
        }
        return -1;
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
    protected readonly prefixTemplate = contentChild(ChipPrefixTemplateDirective, { read: TemplateRef });
    protected readonly removeIcon = CircleX;
    protected readonly role = computed(() => {
        if (this.toggleable()) {
            return "checkbox";
        }
        return undefined;
    });

    /**
     * @description Sets the aria-label for the chip host element.
     */
    public readonly ariaLabel = input<string>();

    /**
     * @description Emits when the chip is activated (clicked or keyboard triggered).
     */
    public readonly contentClick = output<void>();

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
     * @description Sets the selected state of the chip.
     */
    public readonly selected = model(false);

    /**
     * @description Sets the size of the chip.
     */
    public readonly size = input<ChipVariantProps["size"]>("medium");

    /**
     * @description Sets the tabindex of the chip.
     */
    public readonly tabindex = input<number | string>();

    /**
     * @description Sets the toggleable state of the chip.
     */
    public readonly toggleable = input(false);

    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Sets the value of the chip. Useful for identification in selection scenarios.
     */
    public readonly value = input<unknown>();

    public constructor() {
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    protected onRemoveClick(event: Event): void {
        if (this.disabled()) {
            return;
        }
        event.stopPropagation();
        this.remove.emit(event);
    }

    #handleActivation(): void {
        if (this.toggleable()) {
            this.selected.set(!this.selected());
        }
        this.contentClick.emit();
    }

    #setSubscriptions(): void {
        const element = this.#elementRef.nativeElement;

        fromEvent<KeyboardEvent>(element, "keydown")
            .pipe(
                filter(event => !this.disabled() && (event.key === "Enter" || event.key === " ")),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(event => {
                const target = event.target as HTMLElement;
                if (target.closest("lucide-angular")) {
                    return;
                }
                event.preventDefault();
                this.#handleActivation();
            });

        fromEvent<MouseEvent>(element, "click")
            .pipe(
                filter(() => !this.disabled()),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(event => {
                const target = event.target as HTMLElement;
                if (target.closest("lucide-angular")) {
                    return;
                }
                this.#handleActivation();
            });
    }
}
