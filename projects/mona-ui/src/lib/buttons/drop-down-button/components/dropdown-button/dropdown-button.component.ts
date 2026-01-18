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
    viewChild
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
        return ariaLabel || `${text} dropdown button`;
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
     * @description ARIA label for the dropdown button.
     */
    public readonly ariaLabel = input<string>("");

    /**
     * @description ARIA labelledby for the dropdown button.
     */
    public readonly ariaLabelledby = input<string>("");

    /**
     * @description Sets the icon-only state of the button.
     * When set to true, the button will appear as square.
     */
    public readonly iconOnly = input(false);

    /**
     * @description Sets the disabled state of the button.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the loading state of the button.
     */
    public readonly loading = input(false);

    /**
     * @description Sets the look of the button.
     */
    public readonly look = input<ButtonVariantProps["look"]>("default");

    /**
     * @description The click event of the menu item.
     * Emits when a menu item is selected by keyboard or mouse.
     */
    public readonly menuItemClick = output<PopupMenuItemClickEvent>();

    /**
     * @description Sets the border radius of the button.
     */
    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the button.
     */
    public readonly size = input<ButtonVariantProps["size"]>("medium");

    /**
     * @description The text of the button.
     */
    public readonly text = input<string>("");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        afterNextRender({
            read: () => this.setKeyboardEvents()
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

    private closeMenu(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && this.isMenuOpen()) {
            popupMenu.closeMenu();
            this.buttonRef()?.nativeElement?.focus();
        }
    }

    private openMenuViaKeyboard(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && !this.isMenuOpen()) {
            popupMenu.openMenuViaKeyboard();
        }
    }

    private setKeyboardEvents(): void {
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
                        this.openMenuViaKeyboard();
                        break;
                    case "Escape":
                        if (this.isMenuOpen()) {
                            this.closeMenu();
                        }
                        break;
                }
            });
    }
}
