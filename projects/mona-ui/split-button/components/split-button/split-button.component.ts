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
import type { ButtonGroupMember } from "@nanahoshi/mona-ui/button";
import {
    PopupMenuComponent,
    PopupMenuGroupTemplateDirective,
    PopupMenuIconTemplateDirective,
    PopupMenuShortcutTemplateDirective,
    PopupMenuTextTemplateDirective
} from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuToken } from "@nanahoshi/mona-ui/internal/popup-menu";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { SplitButtonMenuButtonTemplateDirective } from "../../directives/split-button-menu-button-template.directive";
import { SplitButtonMenuGroupTemplateDirective } from "../../directives/split-button-menu-group-template.directive";
import { SplitButtonMenuItemIconTemplateDirective } from "../../directives/split-button-menu-item-icon-template.directive";
import { SplitButtonMenuItemShortcutTemplateDirective } from "../../directives/split-button-menu-item-shortcut-template.directive";
import { SplitButtonMenuItemTextTemplateDirective } from "../../directives/split-button-menu-item-text-template.directive";
import { SplitButtonTextTemplateDirective } from "../../directives/split-button-text-template.directive";
import { SPLIT_BUTTON_DEFAULT_MESSAGES } from "../../i18n/split-button.default-messages";
import {
    splitButtonThemeVariants,
    SplitButtonVariantInputs,
    SplitButtonVariantProps
} from "../../styles/split-button.styles";
import { ensureSplitButtonComponentTypes } from "../../utils/split-button.utils";

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
    providers: [{ provide: BUTTON_GROUP_MEMBER, useExisting: SplitButtonComponent }],
    host: {
        "[attr.aria-busy]": "loading() || null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "mainButtonId",
        "[class]": "classes()",
        role: "group"
    }
})
export class SplitButtonComponent implements ButtonGroupMember, SplitButtonVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #i18n = inject(MonaI18nService);
    private readonly menuItemComponents = contentChildren(PopupMenuToken, { descendants: false });
    protected readonly classes = computed(() => {
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const classes = splitButtonThemeVariants({
            look,
            rounded,
            size
        });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly effectiveMenuButtonAriaLabel = computed(() => {
        const label = this.menuButtonAriaLabel();
        if (label) {
            return label;
        }
        const messages = this.messages();
        const name = this.text() || this.ariaLabel();
        return name ? messages.menuButtonWithText(name) : messages.menuButtonAriaLabel;
    });
    protected readonly groupTemplate = contentChild(SplitButtonMenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly iconTemplate = contentChild(SplitButtonMenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly mainButtonId = createElementControlId();
    protected readonly mainButtonTextTemplate = contentChild(SplitButtonTextTemplateDirective, { read: TemplateRef });
    /** The menu is named by the element it opens from, through this id. */
    protected readonly menuButtonId = createElementControlId();
    protected readonly menuButtonRef = viewChild<ElementRef<HTMLButtonElement>>("menuButton");
    protected readonly menuButtonTemplate = contentChild(SplitButtonMenuButtonTemplateDirective, { read: TemplateRef });
    protected readonly menuId = createElementControlId();
    protected readonly menuItems = computed(() => {
        return this.menuItemComponents()
            .map(item => item.getPopupMenuItem())
            .flatMap(i => i);
    });
    protected readonly menuOpen = signal(false);
    protected readonly messages = this.#i18n.componentMessages("splitButton", SPLIT_BUTTON_DEFAULT_MESSAGES);
    protected readonly popupMenuRef = viewChild<PopupMenuComponent>("popupMenu");
    protected readonly popupMenuRounded = computed(() => {
        const rounded = this.rounded();
        return rounded === "full" ? "large" : rounded;
    });
    protected readonly shortcutTemplate = contentChild(SplitButtonMenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly textTemplate = contentChild(SplitButtonMenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });

    /**
     * @description Accessible name for the main action button. Leave it empty when the button shows its name as
     * text; set it (or `aria-labelledby`) when it shows only an icon. The pair of buttons is a group named by the
     * main button.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the main action button.
     * Takes precedence over `aria-label` when both are set.
     * @default ""
     */
    public readonly ariaLabelledBy = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Emitted when the main action button is clicked.
     */
    public readonly buttonClick = output<MouseEvent>();

    /**
     * @description Renders the component with reduced visual emphasis
     * and removes pointer interaction from both the main button and the menu toggle button. Disabling it closes the
     * open menu.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * The main and arrow buttons, which join a surrounding `mona-button-group`.
     */
    public readonly groupButtons = viewChildren(ButtonDirective);

    /**
     * @description Renders the main button as a square for icon-only content, removing horizontal text padding.
     * Set `aria-label` so the main button has a name.
     * @default false
     */
    public readonly iconOnly = input(false);

    /**
     * @description Shows a loading indicator on the main button and keeps the menu from opening while an operation
     * is in progress. Starting to load closes the open menu.
     * @default false
     */
    public readonly loading = input(false);

    /**
     * @description Visual style preset applied to the button.
     * @default "default"
     */
    public readonly look = input<SplitButtonVariantProps["look"]>("default");

    /**
     * @description Accessible name for the menu toggle button.
     * If not provided, it's the localized "More {text} options", or "Show menu options" when the main button has no
     * `text` or `aria-label`.
     * @default ""
     */
    public readonly menuButtonAriaLabel = input("");

    /**
     * @description Emitted when a menu item in the popup is clicked.
     */
    public readonly menuItemClick = output<PopupMenuItemClickEvent>();

    /**
     * @description Minimum width of the popup menu in pixels.
     * A value of `0` means no minimum width is applied.
     * @default 0
     */
    public readonly popupWidth = input(0);

    /**
     * @description Border-radius preset applied to the button.
     * @default "medium"
     */
    public readonly rounded = input<SplitButtonVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the button's dimensions.
     * @default "medium"
     */
    public readonly size = input<SplitButtonVariantProps["size"]>("medium");

    /**
     * @description Primary text content displayed in the main action button.
     * Ignored when a `monaSplitButtonTextTemplate` is provided.
     * @default ""
     */
    public readonly text = input("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => ensureSplitButtonComponentTypes(this.menuItemComponents()));
        effect(() => {
            if (this.disabled() || this.loading() || this.groupButtons().some(button => button.effectiveDisabled())) {
                untracked(() => this.popupMenuRef()?.closeMenu());
            }
        });
        afterNextRender({
            read: () => this.#setKeyboardEvents()
        });
    }

    protected onMainButtonClick(event: MouseEvent): void {
        this.popupMenuRef()?.closeMenu();
        this.buttonClick.emit(event);
    }

    protected onMainButtonKeydown(event: KeyboardEvent): void {
        if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            this.#openMenuViaKeyboard(event.key === "ArrowUp" ? "last" : "first");
        }
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

    #closeMenu(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && this.menuOpen()) {
            popupMenu.closeMenu();
            this.menuButtonRef()?.nativeElement?.focus();
        }
    }

    #openMenuViaKeyboard(focus: "first" | "last"): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && !this.menuOpen() && !this.disabled() && !this.loading()) {
            popupMenu.openMenuViaKeyboard(false, focus);
        }
    }

    #setKeyboardEvents(): void {
        const menuButtonElement = this.menuButtonRef()?.nativeElement;
        if (!menuButtonElement) {
            return;
        }
        fromEvent<KeyboardEvent>(menuButtonElement, "keydown")
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
                        if (this.menuOpen()) {
                            this.#closeMenu();
                        }
                        break;
                }
            });
    }
}
