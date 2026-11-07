import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideChevronDown } from "@lucide/angular";
import { BUTTON_GROUP_MEMBER, ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { ButtonGroupMember, ButtonVariantProps } from "@nanahoshi/mona-ui/button";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import {
    PopupMenuComponent,
    PopupMenuGroupTemplateDirective,
    PopupMenuIconTemplateDirective,
    PopupMenuShortcutTemplateDirective,
    PopupMenuTextTemplateDirective,
    PopupMenuToken
} from "@nanahoshi/mona-ui/popup-menu";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { fromEvent } from "rxjs";
import { DropdownButtonMenuGroupTemplateDirective } from "../../directives/dropdown-button-menu-group-template.directive";
import { DropdownButtonMenuItemIconTemplateDirective } from "../../directives/dropdown-button-menu-item-icon-template.directive";
import { DropdownButtonMenuItemShortcutTemplateDirective } from "../../directives/dropdown-button-menu-item-shortcut-template.directive";
import { DropdownButtonMenuItemTextTemplateDirective } from "../../directives/dropdown-button-menu-item-text-template.directive";
import { DropdownButtonTextTemplateDirective } from "../../directives/dropdown-button-text-template.directive";
import type { DropdownButtonVariantInputs } from "../../styles/dropdown-button.styles";
import { ensureDropdownButtonComponentTypes } from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button",
    templateUrl: "./dropdown-button.component.html",
    providers: [{ provide: BUTTON_GROUP_MEMBER, useExisting: DropdownButtonComponent }],
    host: {
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[class]": "userClass()"
    },
    imports: [
        ButtonDirective,
        LucideChevronDown,
        PopupMenuComponent,
        PopupMenuGroupTemplateDirective,
        PopupMenuIconTemplateDirective,
        PopupMenuShortcutTemplateDirective,
        PopupMenuTextTemplateDirective,
        NgTemplateOutlet
    ]
})
export class DropdownButtonComponent implements ButtonGroupMember, DropdownButtonVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #triggerWidth = signal(0);
    private readonly menuItemComponents = contentChildren(PopupMenuToken, { descendants: false });
    protected readonly buttonRef = viewChild<ElementRef<HTMLButtonElement>>("dropdownButton");
    protected readonly groupTemplate = contentChild(DropdownButtonMenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly isMenuOpen = signal(false);
    protected readonly menuId = createElementControlId();
    protected readonly menuItemIconTemplate = contentChild(DropdownButtonMenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItemShortcutTemplate = contentChild(DropdownButtonMenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItemTextTemplate = contentChild(DropdownButtonMenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItems = computed(() => {
        return this.menuItemComponents()
            .map(item => item.getPopupMenuItem())
            .flatMap(i => i);
    });
    protected readonly popupMenuRef = viewChild<PopupMenuComponent>("popupMenu");
    protected readonly popupMenuRounded = computed(() => {
        const rounded = this.rounded();
        return rounded === "full" ? "large" : rounded;
    });
    protected readonly popupMinWidth = computed(() => this.popupWidth() || this.#triggerWidth() || undefined);
    protected readonly textTemplate = contentChild(DropdownButtonTextTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Accessible name for the dropdown button. Leave it empty when the button shows its name as text;
     * set it (or `aria-labelledby`) when the button shows only an icon.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the dropdown button.
     * Takes precedence over `aria-label` when both are set.
     * @default ""
     */
    public readonly ariaLabelledby = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Renders the button with reduced visual emphasis and removes pointer interaction. Disabling the
     * button closes its open menu.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * The trigger button, which joins a surrounding `mona-button-group`.
     */
    public readonly groupButtons = viewChildren(ButtonDirective);

    /**
     * @description Renders the button as a square for icon-only usage, removing horizontal text padding and the arrow.
     * Set `aria-label` when no visible text is present to ensure an accessible name.
     * @default false
     */
    public readonly iconOnly = input(false);

    /**
     * @description Displays a loading indicator and prevents interaction while an operation is in progress. Starting
     * to load closes the open menu.
     * @default false
     */
    public readonly loading = input(false);

    /**
     * @description Visual style preset applied to the button.
     * @default "default"
     */
    public readonly look = input<ButtonVariantProps["look"]>("default");

    /**
     * @description Emitted when a menu item in the dropdown menu is clicked.
     */
    public readonly menuItemClick = output<PopupMenuItemClickEvent>();

    /**
     * @description Minimum width of the popup menu in pixels. A value of `0` makes the menu at least as wide as the
     * button.
     * @default 0
     */
    public readonly popupWidth = input(0);

    /**
     * @description Border-radius preset applied to the button. The menu follows it (`"full"` gives it large corners).
     * @default "medium"
     */
    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");

    /**
     * @description Shows a down arrow after the text, so the button reads as one that opens a menu. Icon-only buttons
     * never show it.
     * @default true
     */
    public readonly showArrow = input(true);

    /**
     * @description Size preset controlling the button's dimensions.
     * @default "medium"
     */
    public readonly size = input<ButtonVariantProps["size"]>("medium");

    /**
     * @description Primary text content displayed inside the dropdown button.
     * Passed as `$implicit` to a `monaDropdownButtonTextTemplate` when one is provided.
     * @default ""
     */
    public readonly text = input<string>("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => ensureDropdownButtonComponentTypes(this.menuItemComponents()));
        effect(() => {
            if (this.disabled() || this.loading() || this.groupButtons().some(button => button.effectiveDisabled())) {
                untracked(() => this.popupMenuRef()?.closeMenu());
            }
        });
        afterNextRender({
            read: () => {
                this.#setKeyboardEvents();
                this.#observeTriggerWidth();
            }
        });
    }

    protected onMenuClose(): void {
        this.isMenuOpen.set(false);
    }

    protected onMenuItemClick(event: PopupMenuItemClickEvent): void {
        this.menuItemClick.emit(event);
    }

    protected onMenuOpen(): void {
        this.isMenuOpen.set(true);
    }

    #closeMenu(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && this.isMenuOpen()) {
            popupMenu.closeMenu();
            this.buttonRef()?.nativeElement?.focus();
        }
    }

    #observeTriggerWidth(): void {
        const button = this.buttonRef()?.nativeElement;
        if (!button || typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(() => this.#triggerWidth.set(button.offsetWidth));
        observer.observe(button);
        this.#destroyRef.onDestroy(() => observer.disconnect());
    }

    #openMenuViaKeyboard(focus: "first" | "last"): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && !this.isMenuOpen() && !this.disabled() && !this.loading()) {
            popupMenu.openMenuViaKeyboard(false, focus);
        }
    }

    #setKeyboardEvents(): void {
        const buttonElement = this.buttonRef()?.nativeElement;
        if (!buttonElement) {
            return;
        }
        fromEvent<KeyboardEvent>(buttonElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                switch (event.key) {
                    case "ArrowDown":
                    case " ":
                    case "Enter":
                        event.preventDefault();
                        this.#openMenuViaKeyboard("first");
                        break;
                    case "ArrowUp":
                        event.preventDefault();
                        this.#openMenuViaKeyboard("last");
                        break;
                    case "Escape":
                        if (this.isMenuOpen()) {
                            this.#closeMenu();
                        }
                        break;
                }
            });
    }
}
