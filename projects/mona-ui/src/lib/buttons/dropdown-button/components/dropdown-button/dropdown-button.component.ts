import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    ElementRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    viewChild,
    ChangeDetectionStrategy
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { PopupMenuComponent } from "../../../../common/popup-menu/components/popup-menu/popup-menu.component";
import { PopupMenuGroupTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-group-template.directive";
import { PopupMenuIconTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-icon-template.directive";
import { PopupMenuShortcutTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-shortcut-template.directive";
import { PopupMenuTextTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-text-template.directive";
import { PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { PopupMenuItemClickEvent } from "../../../../common/popup-menu/models/PopupMenuItemClickEvent";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { ButtonVariantProps, DropdownButtonVariantInputs } from "../../../button/styles/button.styles";
import { DropdownButtonMenuGroupTemplateDirective } from "../../directives/dropdown-button-menu-group-template.directive";
import { DropdownButtonMenuItemIconTemplateDirective } from "../../directives/dropdown-button-menu-item-icon-template.directive";
import { DropdownButtonMenuItemShortcutTemplateDirective } from "../../directives/dropdown-button-menu-item-shortcut-template.directive";
import { DropdownButtonMenuItemTextTemplateDirective } from "../../directives/dropdown-button-menu-item-text-template.directive";
import { DropdownButtonTextTemplateDirective } from "../../directives/dropdown-button-text-template.directive";

@Component({
    selector: "mona-dropdown-button",
    templateUrl: "./dropdown-button.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "userClass()"
    },
    imports: [
        ButtonDirective,
        PopupMenuComponent,
        PopupMenuGroupTemplateDirective,
        PopupMenuIconTemplateDirective,
        PopupMenuShortcutTemplateDirective,
        PopupMenuTextTemplateDirective,
        NgTemplateOutlet
    ]
})
export class DropdownButtonComponent implements DropdownButtonVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    private readonly menuItemComponents = contentChildren(PopupMenuToken, { descendants: false });
    protected readonly buttonRef = viewChild<ElementRef<HTMLButtonElement>>("dropdownButton");
    protected readonly dropdownButtonAriaLabel = computed(() => {
        const ariaLabel = this.ariaLabel();
        const text = this.text();
        return ariaLabel || `${text} dropdown button`.trim();
    });
    protected readonly isMenuOpen = signal(false);
    protected readonly menuId = createElementControlId();
    protected readonly groupTemplate = contentChild(DropdownButtonMenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItemIconTemplate = contentChild(DropdownButtonMenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItems = computed(() => {
        return this.menuItemComponents()
            .map(item => item.getPopupMenuItem())
            .flatMap(i => i);
    });
    protected readonly menuItemShortcutTemplate = contentChild(DropdownButtonMenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItemTextTemplate = contentChild(DropdownButtonMenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly popupMenuRef = viewChild<PopupMenuComponent>("popupMenu");
    protected readonly textTemplate = contentChild(DropdownButtonTextTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Accessible name for the dropdown button.
     * Falls back to `"{text} dropdown button"` when empty; provide an explicit value when no visible text is present.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the dropdown button.
     * Takes precedence over `ariaLabel` when both are set.
     * @default ""
     */
    public readonly ariaLabelledby = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Renders the button as a square for icon-only usage, removing horizontal text padding.
     * Set `ariaLabel` when no visible text is present to ensure an accessible name.
     * @default false
     */
    public readonly iconOnly = input(false);

    /**
     * @description Renders the button with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Displays a loading indicator and prevents interaction while an operation is in progress.
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
     * @description Border-radius preset applied to the button.
     * @default "medium"
     */
    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");

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
        afterNextRender({
            read: () => this.#setKeyboardEvents()
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

    #openMenuViaKeyboard(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && !this.isMenuOpen()) {
            popupMenu.openMenuViaKeyboard();
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
                    case "ArrowUp":
                    case " ":
                    case "Enter":
                        event.preventDefault();
                        this.#openMenuViaKeyboard();
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
