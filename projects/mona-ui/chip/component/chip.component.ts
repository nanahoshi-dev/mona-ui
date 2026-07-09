import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
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
import { LucideCircleX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { filter, fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ChipPrefixTemplateDirective } from "../directives/chip-prefix-template.directive";
import { chipThemeVariants, ChipVariantInputs, ChipVariantProps } from "../styles/chip.styles";

@Component({
    selector: "mona-chip",
    templateUrl: "./chip.component.html",
    imports: [ButtonDirective, NgTemplateOutlet, LucideCircleX],
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
        if (!this.toggleable()) {
            return undefined;
        }
        return this.selected() ? "true" : "false";
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
        if (this.toggleable() || this.removable()) {
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
    protected readonly role = computed(() => {
        if (this.toggleable()) {
            return "checkbox";
        }
        return undefined;
    });

    /**
     * @description Accessible name for the host element. Describe what the chip represents.
     * When empty, assistive technology announces the role without a label.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Emitted when the chip body is clicked or activated via Enter or Space.
     * Not emitted when the remove button is activated.
     */
    public readonly contentClick = output<void>();

    /**
     * @description Renders the chip with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Text label displayed inside the chip. When non-empty, takes precedence over projected content.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description Visual style variant controlling the chip's background color, border, and interaction states.
     * @default "default"
     */
    public readonly look = input<ChipVariantProps["look"]>("default");

    /**
     * @description Renders a remove button inside the chip. When activated, emits the `remove` output.
     * @default false
     */
    public readonly removable = input(false);

    /**
     * @description Emitted when the remove button is clicked. Only fires when `removable` is `true`.
     * Emits the originating `Event`.
     */
    public readonly remove = output<Event>();

    /**
     * @description Accessible label for the remove button, overriding the auto-computed `"Remove, <label>"` fallback.
     * Use when the chip shows only projected content and the default label is not descriptive enough.
     * @default undefined
     */
    public readonly removeLabel = input<string>();

    /**
     * @description Tab index for the remove button, independent of the chip host's own tabindex.
     * Set to `-1` to exclude the remove button from tab order when an equivalent keyboard path exists elsewhere.
     * @default 0
     */
    public readonly removeTabIndex = input<number | string>(0);

    /**
     * @description Border-radius preset applied to the chip.
     * @default "full"
     */
    public readonly rounded = input<ChipVariantProps["rounded"]>("full");

    /**
     * @description Whether the chip is selected. When `toggleable` is `true`, each activation flips this value.
     * Supports two-way binding via `[(selected)]`.
     * @default false
     */
    public readonly selected = model(false);

    /**
     * @description Size preset controlling the chip's padding and remove button dimensions.
     * @default "medium"
     */
    public readonly size = input<ChipVariantProps["size"]>("medium");

    /**
     * @description Tab index override for the chip host element. When not set, computed automatically:
     * `0` when `toggleable` or `removable` is `true`, `-1` otherwise. Overridden to `-1` when `disabled` is `true`.
     * @default undefined
     */
    public readonly tabindex = input<number | string>();

    /**
     * @description Enables toggle behavior. When `true`, each activation flips `selected`
     * and the host receives `role="checkbox"` with `aria-checked`.
     * @default false
     */
    public readonly toggleable = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Arbitrary value associated with this chip.
     * Useful for identifying which chip was selected or removed in a collection.
     * @default undefined
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
                if (target.closest("button[data-chip-remove]")) {
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
            .subscribe(() => {
                this.#handleActivation();
            });
    }
}
