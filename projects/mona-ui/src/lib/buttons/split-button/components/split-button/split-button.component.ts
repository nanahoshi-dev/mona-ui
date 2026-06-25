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
import { LucideChevronDown } from "@lucide/angular";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { PopupMenuComponent } from "../../../../common/popup-menu/components/popup-menu/popup-menu.component";
import { PopupMenuGroupTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-group-template.directive";
import { PopupMenuIconTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-icon-template.directive";
import { PopupMenuShortcutTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-shortcut-template.directive";
import { PopupMenuTextTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-text-template.directive";
import { PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { PopupMenuItemClickEvent } from "../../../../common/popup-menu/models/PopupMenuItemClickEvent";
import { ThemeService } from "../../../../theme/services/theme.service";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { SplitButtonMenuButtonTemplateDirective } from "../../directives/split-button-menu-button-template.directive";
import { SplitButtonMenuGroupTemplateDirective } from "../../directives/split-button-menu-group-template.directive";
import { SplitButtonMenuItemIconTemplateDirective } from "../../directives/split-button-menu-item-icon-template.directive";
import { SplitButtonMenuItemShortcutTemplateDirective } from "../../directives/split-button-menu-item-shortcut-template.directive";
import { SplitButtonMenuItemTextTemplateDirective } from "../../directives/split-button-menu-item-text-template.directive";
import { SplitButtonTextTemplateDirective } from "../../directives/split-button-text-template.directive";
import {
    splitButtonThemeVariants,
    SplitButtonVariantInputs,
    SplitButtonVariantProps
} from "../../styles/split-button.styles";

@Component({
    selector: "mona-split-button",
    templateUrl: "./split-button.component.html",
    imports: [
        ButtonDirective,
        NgTemplateOutlet,
        PopupMenuComponent,
        PopupMenuGroupTemplateDirective,
        PopupMenuIconTemplateDirective,
        PopupMenuShortcutTemplateDirective,
        PopupMenuTextTemplateDirective,
        LucideChevronDown
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        "[class]": "classes()",
        "[class.mona-split-button]": "true"
    }
})
export class SplitButtonComponent implements SplitButtonVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #themeService = inject(ThemeService);
    private readonly menuItemComponents = contentChildren(PopupMenuToken, { descendants: false });
    protected readonly menuButtonRef = viewChild<ElementRef<HTMLButtonElement>>("menuButton");
    protected readonly popupMenuRef = viewChild<PopupMenuComponent>("popupMenu");
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const classes = splitButtonThemeVariants(theme)({
            look,
            rounded,
            size
        });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly groupTemplate = contentChild(SplitButtonMenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly iconTemplate = contentChild(SplitButtonMenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly mainButtonTextTemplate = contentChild(SplitButtonTextTemplateDirective, { read: TemplateRef });
    protected readonly menuButtonTemplate = contentChild(SplitButtonMenuButtonTemplateDirective, { read: TemplateRef });
    protected readonly menuId = createElementControlId();
    protected readonly menuItems = computed(() => {
        return this.menuItemComponents()
            .map(item => item.getPopupMenuItem())
            .flatMap(i => i);
    });
    protected readonly menuOpen = signal(false);
    protected readonly popupMenuRounded = computed(() => {
        const rounded = this.rounded();
        return rounded === "full" ? "large" : rounded;
    });
    protected readonly shortcutTemplate = contentChild(SplitButtonMenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly splitButtonAriaLabel = computed(() => {
        const ariaLabel = this.ariaLabel();
        const text = this.text();
        return ariaLabel || `${text} splitbutton`;
    });
    protected readonly textTemplate = contentChild(SplitButtonMenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });

    /**
     * @description Accessible label for the main action button.
     * Falls back to `"{text} splitbutton"` when empty.
     * @default ""
     */
    public readonly ariaLabel = input<string>("");

    /**
     * @description ID of an element that labels the main action button.
     * Takes precedence over `ariaLabel` when set.
     * @default ""
     */
    public readonly ariaLabelledby = input<string>("");

    /**
     * @description Emits when the main action button is clicked.
     */
    public readonly buttonClick = output<MouseEvent>();

    /**
     * @description Sets the disabled state of both the main button and the menu toggle button.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the visual look of the button.
     * @default "default"
     */
    public readonly look = input<SplitButtonVariantProps["look"]>("default");

    /**
     * @description Accessible label for the menu toggle button.
     * Override to localize the label for non-English applications.
     * @default "Show menu options"
     */
    public readonly menuButtonAriaLabel = input("Show menu options");

    /**
     * @description Emits when a menu item inside the popup is clicked.
     */
    public readonly menuItemClick = output<PopupMenuItemClickEvent>();

    /**
     * @description Minimum width of the popup menu in pixels.
     * A value of `0` means no minimum width is applied.
     * @default 0
     */
    public readonly popupWidth = input(0);

    /**
     * @description Sets the border radius of the button.
     * @default "medium"
     */
    public readonly rounded = input<SplitButtonVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the button.
     * @default "medium"
     */
    public readonly size = input<SplitButtonVariantProps["size"]>("medium");

    /**
     * @description Text displayed in the main action button.
     * Ignored when `monaSplitButtonTextTemplate` is provided.
     * @default ""
     */
    public readonly text = input("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        afterNextRender({
            read: () => this.setKeyboardEvents()
        });
    }

    protected onMenuClose(): void {
        this.menuOpen.set(false);
    }

    protected onMenuItemClick(event: PopupMenuItemClickEvent): void {
        this.menuItemClick.emit(event);
    }

    protected onMenuOpen(): void {
        this.menuOpen.set(true);
    }

    private closeMenu(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && this.menuOpen()) {
            popupMenu.closeMenu();
            this.menuButtonRef()?.nativeElement?.focus();
        }
    }

    private openMenuViaKeyboard(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && !this.menuOpen()) {
            popupMenu.openMenuViaKeyboard();
        }
    }

    private setKeyboardEvents(): void {
        const menuButtonElement = this.menuButtonRef()?.nativeElement;
        if (!menuButtonElement) {
            return;
        }
        fromEvent<KeyboardEvent>(menuButtonElement, "keydown")
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
                        if (this.menuOpen()) {
                            this.closeMenu();
                        }
                        break;
                }
            });
    }
}
