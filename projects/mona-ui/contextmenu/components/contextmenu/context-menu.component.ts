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
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    PopupMenuComponent,
    PopupMenuGroupTemplateDirective,
    PopupMenuIconTemplateDirective,
    PopupMenuItem,
    PopupMenuItemClickEvent,
    PopupMenuShortcutTemplateDirective,
    PopupMenuTextTemplateDirective,
    PopupMenuToken
} from "@mirei/mona-ui/popup-menu";
import { createElementControlId } from "@mirei/mona-ui/common";
import { any } from "@mirei/ts-collections";
import { fromEvent } from "rxjs";
import { ContextMenuGroupTemplateDirective } from "../../directives/context-menu-group-template.directive";
import { ContextMenuIconTemplateDirective } from "../../directives/context-menu-icon-template.directive";
import { ContextMenuShortcutTemplateDirective } from "../../directives/context-menu-shortcut-template.directive";
import { ContextMenuTextTemplateDirective } from "../../directives/context-menu-text-template.directive";
import { ContextMenuVariantInput, ContextMenuVariantProps } from "../../styles/contextmenu.styles";
import { ensureContextMenuComponentTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu",
    templateUrl: "./context-menu.component.html",
    imports: [
        PopupMenuComponent,
        PopupMenuTextTemplateDirective,
        NgTemplateOutlet,
        PopupMenuIconTemplateDirective,
        PopupMenuShortcutTemplateDirective,
        PopupMenuGroupTemplateDirective
    ]
})
export class ContextMenuComponent implements ContextMenuVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #isMenuOpen = signal(false);

    private readonly menuItemComponents = contentChildren(PopupMenuToken, { descendants: false });
    protected readonly groupTemplate = contentChild(ContextMenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly iconTemplate = contentChild(ContextMenuIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuId = createElementControlId();
    protected readonly menuItems = computed(() => {
        if (any(this.items())) {
            return this.items();
        }
        return this.menuItemComponents()
            .map(item => item.getPopupMenuItem())
            .flatMap(i => i);
    });
    protected readonly popupMenuRef = viewChild<PopupMenuComponent>("popupMenu");
    protected readonly shortcutTemplate = contentChild(ContextMenuShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly textTemplate = contentChild(ContextMenuTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });

    /**
     * @description Reserved for an ARIA label on the context menu.
     * Not currently applied to the target element or the rendered menu.
     */
    public readonly ariaLabel = input<string>("");

    /**
     * @description The menu items to render. When provided, these take precedence over
     * content-projected `mona-contextmenu-item` (and related) components.
     */
    public readonly items = input<Iterable<PopupMenuItem>>([]);

    /**
     * @description Emits when a menu item is clicked.
     */
    public readonly menuClick = output<PopupMenuItemClickEvent>();

    /**
     * @description Sets the minimum width of the context menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly minWidth = input<string | number>();

    /**
     * @description Sets the rounded state of the context menu.
     */
    public readonly rounded = input<ContextMenuVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the context menu.
     */
    public readonly size = input<ContextMenuVariantProps["size"]>("medium");

    /**
     * @description The target element that will be used to trigger the context menu.
     */
    public readonly target = input.required<ElementRef<HTMLElement> | HTMLElement>();

    /**
     * @description Sets the width of the context menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly width = input<string | number>();

    public constructor() {
        effect(() => ensureContextMenuComponentTypes(this.menuItemComponents()));
        afterNextRender({
            read: () => {
                this.setTargetAriaAttributes();
                this.setKeyboardEvents();
            }
        });
    }

    protected onMenuClose(): void {
        this.#isMenuOpen.set(false);
        this.updateTargetAriaAttributes();
    }

    protected onMenuOpen(): void {
        this.#isMenuOpen.set(true);
        this.updateTargetAriaAttributes();
    }

    private openMenuViaKeyboard(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && !this.#isMenuOpen()) {
            popupMenu.openMenuViaKeyboard(true);
        }
    }

    private setKeyboardEvents(): void {
        const target = this.target();
        const targetElement = target instanceof ElementRef ? target.nativeElement : target;
        if (!targetElement) {
            return;
        }

        fromEvent<KeyboardEvent>(targetElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
                    event.preventDefault();
                    this.openMenuViaKeyboard();
                }
            });
    }

    private setTargetAriaAttributes(): void {
        const target = this.target();
        const targetElement = target instanceof ElementRef ? target.nativeElement : target;
        if (!targetElement) {
            return;
        }

        targetElement.setAttribute("aria-haspopup", "menu");
        targetElement.setAttribute("aria-controls", this.menuId);
        this.updateTargetAriaAttributes();
    }

    private updateTargetAriaAttributes(): void {
        const target = this.target();
        const targetElement = target instanceof ElementRef ? target.nativeElement : target;
        if (!targetElement) {
            return;
        }
        targetElement.setAttribute("aria-expanded", this.#isMenuOpen().toString());
    }
}
