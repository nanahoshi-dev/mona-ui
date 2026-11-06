import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    input,
    isDevMode,
    model,
    output,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { LucideCircleX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ChipPrefixTemplateDirective } from "../directives/chip-prefix-template.directive";
import { CHIP_DEFAULT_MESSAGES } from "../i18n/chip.default-messages";
import { CHIP_BODY_CONTROL_CLASSES, chipThemeVariants, ChipVariantInputs, ChipVariantProps } from "../styles/chip.styles";

/** Projected controls keep their own clicks and keys. */
const PROJECTED_CONTROL_SELECTOR = "a[href], button, input, select, textarea, [role='button'], [role='link'], [tabindex]";

@Component({
    selector: "mona-chip",
    templateUrl: "./chip.component.html",
    imports: [ButtonDirective, NgTemplateOutlet, LucideCircleX],
    host: {
        "[class]": "baseClass()",
        "[attr.tabindex]": "split() ? null : effectiveTabIndex()",
        "[attr.aria-disabled]": "hostRole() && disabled() ? 'true' : null",
        "[attr.role]": "hostRole()",
        "[attr.aria-checked]": "split() ? null : ariaChecked()",
        "[attr.aria-label]": "split() ? null : ariaLabel() || null"
    }
})
export class ChipComponent implements ChipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #routerLink = inject(RouterLink, { optional: true });

    protected readonly ariaChecked = computed(() => {
        if (!this.toggleable()) {
            return undefined;
        }
        return this.selected() ? "true" : "false";
    });
    protected readonly baseClass = computed(() => {
        const disabled = this.disabled();
        const interactive = this.bodyInteractive();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const selected = this.selected();
        const userClass = this.userClass();
        const variantClasses = chipThemeVariants({ disabled, interactive, look, rounded, size, selected });
        return twMerge(variantClasses, userClass);
    });
    protected readonly bodyClasses = computed(() => (this.split() ? CHIP_BODY_CONTROL_CLASSES : "contents"));
    protected readonly bodyElement = viewChild.required<ElementRef<HTMLElement>>("body");
    protected readonly bodyInteractive = computed(
        () => !this.disabled() && (this.toggleable() || this.isLink())
    );
    /** The role of the chip's own control, wherever it ends up. */
    protected readonly controlRole = computed(() => {
        if (this.toggleable()) {
            return "checkbox";
        }
        return this.isLink() ? "link" : null;
    });
    protected readonly effectiveTabIndex = computed(() => {
        const explicitTabindex = this.tabindex();
        if (!this.controlRole() && explicitTabindex == null) {
            return null;
        }
        return this.disabled() ? -1 : (explicitTabindex ?? 0);
    });
    /** A name needs a role to land on, and an interactive host can't hold a remove button. */
    protected readonly hostRole = computed(() => {
        if (this.split()) {
            return "group";
        }
        return this.controlRole() ?? (this.ariaLabel() ? "group" : null);
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
    protected readonly isLink = computed(() => !!this.#routerLink);
    protected readonly messages = this.#i18n.componentMessages("chip", CHIP_DEFAULT_MESSAGES);
    protected readonly prefixTemplate = contentChild(ChipPrefixTemplateDirective, { read: TemplateRef });
    /**
     * An interactive role makes its children presentational, which would hide the remove button, so a chip with both
     * keeps its control on an inner element.
     */
    protected readonly split = computed(() => this.removable() && !!this.controlRole());

    /**
     * @description Accessible name of the chip, for one whose text doesn't describe it, such as an icon. On a chip with no
     * other role, it makes the chip a named group.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Emitted when a toggleable chip body is activated via click, Enter, or Space.
     * Not emitted when the remove button is activated or for non-toggleable chips.
     */
    public readonly contentClick = output<void>();

    /**
     * @description Renders the chip with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

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
    public readonly removable = input(false, { transform: booleanAttribute });

    /**
     * @description Emitted when the remove button is clicked, or Delete or Backspace is pressed on the chip. Only fires
     * when `removable` is `true`. Emits the originating `Event`. The chip can't keep focus once its parent destroys it, so
     * move focus to the next chip or the list here.
     */
    public readonly remove = output<Event>();

    /**
     * @description Accessible label for the remove button, overriding the auto-computed `"Remove, <label>"` fallback.
     * A chip with only projected content needs this or `aria-label`, or it warns in development.
     * @default undefined
     */
    public readonly removeLabel = input<string>();

    /**
     * @description Tab index for the remove button, independent of the chip host's own tabindex.
     * Set to `-1` to exclude the remove button from tab order, since Delete and Backspace on the chip also remove it.
     * @default 0
     */
    public readonly removeTabIndex = input<number | string>(0);

    /**
     * @description Border-radius preset applied to the chip.
     * @default "medium"
     */
    public readonly rounded = input<ChipVariantProps["rounded"]>("medium");

    /**
     * @description Whether the chip is selected. When `toggleable` is `true`, each activation flips this value.
     * Supports two-way binding via `[(selected)]`. Without `toggleable`, it's only a look, with no state for assistive
     * technology.
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
     * `0` when `toggleable` is `true` or functioning as a link, not focusable otherwise. Overridden to `-1` when `disabled`
     * is `true`.
     * @default undefined
     */
    public readonly tabindex = input<number | string>();

    /**
     * @description Enables toggle behavior. When `true`, each activation flips `selected`
     * and the host receives `role="checkbox"` with `aria-checked`. With `removable`, the host is a `group` instead, and an
     * inner element is the checkbox, beside the remove button.
     * @default false
     */
    public readonly toggleable = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Arbitrary value associated with this chip. The chip doesn't use it or emit it, so to tell which chip was
     * removed, pass the item in your `(remove)` handler.
     * @default undefined
     */
    public readonly value = input<unknown>();

    public constructor() {
        afterNextRender({
            read: () => {
                this.#setSubscriptions();
                this.#warnIfRemoveHasNoName();
            }
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
        if (!this.toggleable() || this.disabled()) {
            return;
        }
        this.selected.set(!this.selected());
        this.contentClick.emit();
    }

    #handleKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        const onControl = target === this.#elementRef.nativeElement || target === this.bodyElement().nativeElement;
        if (this.disabled()) {
            return;
        }
        if (event.key === "Delete" || event.key === "Backspace") {
            if (this.removable() && (onControl || target.closest("button[data-chip-remove]"))) {
                event.preventDefault();
                this.remove.emit(event);
            }
            return;
        }
        if (!onControl) {
            return;
        }
        if (event.key === "Enter" && this.isLink()) {
            event.preventDefault();
            if (!event.repeat) {
                this.#elementRef.nativeElement.click();
            }
        } else if ((event.key === "Enter" || event.key === " ") && this.toggleable()) {
            event.preventDefault();
            if (!event.repeat) {
                this.#handleActivation();
            }
        }
    }

    #isOnProjectedControl(event: Event): boolean {
        const control = (event.target as HTMLElement).closest?.(PROJECTED_CONTROL_SELECTOR);
        return !!control && control !== this.#elementRef.nativeElement && control !== this.bodyElement().nativeElement;
    }

    #setSubscriptions(): void {
        const element = this.#elementRef.nativeElement;

        fromEvent<KeyboardEvent>(element, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.#handleKeydown(event));

        fromEvent<MouseEvent>(element, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                if (!this.#isOnProjectedControl(event)) {
                    this.#handleActivation();
                }
            });
    }

    #warnIfRemoveHasNoName(): void {
        if (isDevMode() && this.removable() && !this.label() && !this.ariaLabel() && !this.removeLabel()) {
            console.warn(
                "[Mona Chip] A removable chip with projected content needs removeLabel or aria-label, or its remove button " +
                    "reads as a generic item.",
                this.#elementRef.nativeElement
            );
        }
    }
}
