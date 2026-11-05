import { NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    Component,
    computed,
    contentChild,
    contentChildren,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import {
    PopupMenuComponent,
    PopupMenuGroupTemplateDirective,
    PopupMenuIconTemplateDirective,
    PopupMenuItem,
    PopupMenuItemClickEvent,
    PopupMenuShortcutTemplateDirective,
    PopupMenuTextTemplateDirective,
    PopupMenuToken
} from "@nanahoshi/mona-ui/popup-menu";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { any } from "@mirei/ts-collections";
import { ContextMenuGroupTemplateDirective } from "../../directives/context-menu-group-template.directive";
import { ContextMenuIconTemplateDirective } from "../../directives/context-menu-icon-template.directive";
import { ContextMenuShortcutTemplateDirective } from "../../directives/context-menu-shortcut-template.directive";
import { ContextMenuTextTemplateDirective } from "../../directives/context-menu-text-template.directive";
import { ContextMenuVariantInput, ContextMenuVariantProps } from "../../styles/contextmenu.styles";
import { ensureContextMenuComponentTypes } from "../../utils/ctx-menu.utils";

/**
 * Roles that allow both `aria-haspopup` and `aria-expanded`. On any other target (a `div`, a `section`, a table row)
 * the attributes are invalid, so the menu leaves them off: context menus are found through the ContextMenu key and
 * Shift+F10, not through `aria-haspopup`.
 */
const POPUP_ROLES: ReadonlySet<string> = new Set(["button", "gridcell", "link", "menuitem", "tab", "treeitem"]);
const MANAGED_ATTRIBUTES = ["aria-controls", "aria-expanded", "aria-haspopup"] as const;

const roleOf = (element: HTMLElement): string | null => {
    const explicit = element.getAttribute("role")?.trim().split(/\s+/)[0];
    if (explicit) {
        return explicit;
    }
    if (element instanceof HTMLButtonElement) {
        return "button";
    }
    if (element instanceof HTMLAnchorElement && element.hasAttribute("href")) {
        return "link";
    }
    if (element instanceof HTMLInputElement && ["button", "image", "reset", "submit"].includes(element.type)) {
        return "button";
    }
    return null;
};

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
    /** The target, while it has a role that allows the popup attributes. */
    readonly #ariaTarget = signal<HTMLElement | null>(null);
    readonly #document = inject(DOCUMENT);
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
     * @description Accessible name for the menu. When empty, the menu is named by the target if it has an `id`.
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
     * @description The target element that will be used to trigger the context menu. It can change: the menu, its
     * keyboard shortcuts and its ARIA attributes follow. `aria-haspopup`, `aria-expanded` and `aria-controls` are set
     * only on targets whose role allows them (button, link, gridcell, menuitem, tab, treeitem), and are put back
     * when the target changes or the menu is destroyed.
     */
    public readonly target = input.required<ElementRef<HTMLElement> | HTMLElement>();

    /**
     * @description Sets the width of the context menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly width = input<string | number>();

    public constructor() {
        effect(() => ensureContextMenuComponentTypes(this.menuItemComponents()));
        // After render, so the target's own host bindings (a monaButton's aria-haspopup) have run and don't undo it.
        afterRenderEffect(onCleanup => {
            const target = this.target();
            const element = target instanceof ElementRef ? target.nativeElement : target;
            if (!element) {
                return;
            }
            onCleanup(untracked(() => this.#attachTo(element)));
        });
        effect(() => {
            const element = this.#ariaTarget();
            const open = this.#isMenuOpen();
            if (!element) {
                return;
            }
            element.setAttribute("aria-expanded", String(open));
            if (open) {
                element.setAttribute("aria-controls", this.menuId);
            } else {
                element.removeAttribute("aria-controls");
            }
        });
        effect(onCleanup => {
            const view = this.#document.defaultView;
            if (!this.#isMenuOpen() || !view) {
                return;
            }
            // Like a native context menu, it closes when the window loses focus.
            const close = (): void => this.popupMenuRef()?.closeMenu();
            view.addEventListener("blur", close);
            onCleanup(() => view.removeEventListener("blur", close));
        });
    }

    protected onMenuClose(): void {
        this.#isMenuOpen.set(false);
    }

    protected onMenuOpen(): void {
        this.#isMenuOpen.set(true);
    }

    /**
     * Listens for the keyboard shortcuts on the target and, when its role allows them, sets the popup attributes.
     * Returns the cleanup that undoes both.
     */
    #attachTo(element: HTMLElement): () => void {
        const onKeydown = (event: KeyboardEvent): void => {
            if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
                event.preventDefault();
                this.openMenuViaKeyboard();
            }
        };
        element.addEventListener("keydown", onKeydown);
        const role = roleOf(element);
        const managed = role !== null && POPUP_ROLES.has(role);
        const previous = MANAGED_ATTRIBUTES.map(name => [name, element.getAttribute(name)] as const);
        if (managed) {
            element.setAttribute("aria-haspopup", "menu");
            this.#ariaTarget.set(element);
        }
        return () => {
            element.removeEventListener("keydown", onKeydown);
            if (managed) {
                this.#ariaTarget.set(null);
                for (const [name, value] of previous) {
                    if (value === null) {
                        element.removeAttribute(name);
                    } else {
                        element.setAttribute(name, value);
                    }
                }
            }
        };
    }

    private openMenuViaKeyboard(): void {
        const popupMenu = this.popupMenuRef();
        if (popupMenu && !this.#isMenuOpen()) {
            popupMenu.openMenuViaKeyboard(true);
        }
    }
}
