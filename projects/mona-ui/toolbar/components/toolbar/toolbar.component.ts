import {
    afterEveryRender,
    afterNextRender,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    isDevMode,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { LucideEllipsis } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId, RovingToolbar } from "@nanahoshi/mona-ui/internal";
import { type MenuItem, PopupMenuComponent, type PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { twMerge } from "tailwind-merge";
import { ToolbarItemDirective } from "../../directives/toolbar-item.directive";
import { TOOLBAR_DEFAULT_MESSAGES } from "../../i18n/toolbar.default-messages";
import type { ToolbarOverflow } from "../../models/ToolbarOverflow";
import { toolbarThemeVariants, type ToolbarVariantProps } from "../../styles/toolbar.styles";

/**
 * A row of controls, such as formatting buttons, that's one Tab stop: the arrow keys move between its controls. Items
 * marked `monaToolbarItem` that don't fit move into a More menu at the end, last ones first, and come back as the row
 * widens.
 */
@Component({
    selector: "mona-toolbar",
    templateUrl: "./toolbar.component.html",
    imports: [ButtonDirective, LucideEllipsis, PopupMenuComponent],
    host: {
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-labelledby]": "ariaLabelledBy() || null",
        "[class]": "baseClass()",
        role: "toolbar",
        "(focusin)": "onFocusIn($event)",
        "(keydown)": "onKeydown($event)"
    }
})
export class ToolbarComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElement: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #i18n = inject(MonaI18nService);
    readonly #overflowed = signal<readonly ToolbarItemDirective[]>([]);
    readonly #roving = new RovingToolbar(() => this.#hostElement);
    #layoutFrame: number | null = null;
    /** The More button's width with the gap before it, from the last time it was shown. */
    #moreWidth: number | null = null;
    #resizeObserver: ResizeObserver | null = null;

    protected readonly baseClass = computed(() =>
        twMerge(toolbarThemeVariants({ overflow: this.overflow(), size: this.size() }), this.userClass())
    );
    protected readonly items = contentChildren(ToolbarItemDirective);
    protected readonly menuId = createElementControlId();
    /** The More menu, read from the hidden controls each time it opens, so their text and states are current. */
    protected readonly menuItems = signal<MenuItem[]>([]);
    protected readonly menuOpen = signal(false);
    protected readonly messages = this.#i18n.componentMessages("toolbar", TOOLBAR_DEFAULT_MESSAGES);
    protected readonly moreButton = viewChild<ElementRef<HTMLButtonElement>>("moreButton");
    protected readonly moreButtonId = createElementControlId();
    protected readonly rightToLeft = signal(false);

    /**
     * @description Accessible name of the toolbar, such as "Formatting". A toolbar needs a name, from this or
     * `aria-labelledby`, since assistive technology announces it on the way in.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description ID of the element whose text names the toolbar, such as a visible heading.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Name of the More button, in place of the localized "More".
     * @default ""
     */
    public readonly moreLabel = input("");

    /**
     * @description What happens to items that don't fit: `menu` moves the `monaToolbarItem`s into a More menu at the end,
     * last ones first, and `wrap` puts the controls on more rows.
     * @default "menu"
     */
    public readonly overflow = input<ToolbarOverflow>("menu");

    /**
     * @description The space between controls and the size of the More button. Match it to the controls' size.
     * @default "medium"
     */
    public readonly size = input<NonNullable<ToolbarVariantProps["size"]>>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    public constructor() {
        afterNextRender({ read: () => this.#warnIfUnnamed() });
        // Controls added later, or whose Tab stop a render reset, join the toolbar's one Tab stop.
        afterEveryRender({ write: () => this.#roving.sync() });
        effect(() => {
            this.items();
            this.overflow();
            this.size();
            untracked(() => this.#observe());
        });
        this.#destroyRef.onDestroy(() => {
            this.#resizeObserver?.disconnect();
            if (this.#layoutFrame != null) {
                cancelAnimationFrame(this.#layoutFrame);
            }
        });
    }

    protected onFocusIn(event: FocusEvent): void {
        this.#roving.onFocusIn(event);
    }

    protected onKeydown(event: KeyboardEvent): void {
        this.#roving.onKeydown(event);
    }

    protected onMenuOpen(): void {
        this.menuItems.set(this.#createMenuItems());
        this.menuOpen.set(true);
    }

    /**
     * Operates the chosen control once the menu has closed and the focus is back on the More button, so a dialog its
     * click opens returns the focus there.
     */
    protected onMenuSelect(event: PopupMenuItemClickEvent): void {
        const item = this.#overflowed()[event.value as number];
        item?.activate(event.originalEvent);
    }

    #createMenuItems(): MenuItem[] {
        const menuItems: MenuItem[] = [];
        for (const [index, item] of this.#overflowed().entries()) {
            if (item.isSeparator()) {
                // A divider only means something between two items.
                if (menuItems.length > 0 && !menuItems[menuItems.length - 1].separator) {
                    menuItems.push({ label: "", separator: true });
                }
                continue;
            }
            const pressed = item.pressed();
            menuItems.push({
                checkable: pressed != null,
                checked: pressed ?? undefined,
                disabled: item.isDisabled(),
                label: item.getMenuText(),
                value: index
            });
        }
        if (menuItems.length > 0 && menuItems[menuItems.length - 1].separator) {
            menuItems.pop();
        }
        return menuItems;
    }

    /**
     * Shows every item, measures what overflows, and hides items from the end until the rest fit beside the More
     * button. It runs within one frame, so nothing is painted in between.
     */
    #layout(): void {
        this.#layoutFrame = null;
        const host = this.#hostElement;
        const items = this.items();
        const moreButton = this.moreButton()?.nativeElement;
        this.rightToLeft.set(host.ownerDocument.defaultView?.getComputedStyle(host).direction === "rtl");
        if (this.overflow() !== "menu" || moreButton == null) {
            items.forEach(item => item.setHidden(false));
            this.#overflowed.set([]);
            this.#roving.sync();
            return;
        }
        const focused = host.ownerDocument.activeElement;
        const gap = parseFloat(host.ownerDocument.defaultView?.getComputedStyle(host).columnGap ?? "") || 0;
        // A shown More button is measured where it is: hiding it, even for a moment, would take focus off it.
        const moreShown = !moreButton.hidden;
        if (moreShown) {
            this.#moreWidth = moreButton.getBoundingClientRect().width + gap;
        } else if (this.#moreWidth == null) {
            moreButton.hidden = false;
            this.#moreWidth = moreButton.getBoundingClientRect().width + gap;
            moreButton.hidden = true;
        }
        const moreWidth = this.#moreWidth;
        items.forEach(item => item.setHidden(false));
        let excess = host.scrollWidth - host.clientWidth - (moreShown ? moreWidth : 0);
        const overflowed: ToolbarItemDirective[] = [];
        if (excess > 0) {
            excess += moreWidth;
            const candidates = items.filter(item => item.overflow() === "auto");
            for (let index = candidates.length - 1; index >= 0 && excess > 0; index--) {
                const item = candidates[index];
                excess -= item.element.getBoundingClientRect().width + gap;
                overflowed.unshift(item);
            }
            // A divider left at the end of the row separates nothing.
            const visible = candidates.filter(item => !overflowed.includes(item));
            for (let index = visible.length - 1; index >= 0 && visible[index].isSeparator(); index--) {
                overflowed.unshift(visible[index]);
            }
            overflowed.sort((a, b) => items.indexOf(a) - items.indexOf(b));
            overflowed.forEach(item => item.setHidden(true));
        }
        const showMore = overflowed.length > 0;
        if (moreButton.hidden === showMore) {
            moreButton.hidden = !showMore;
        }
        this.#overflowed.set(overflowed);
        this.#roving.sync();
        if (!(focused instanceof HTMLElement)) {
            return;
        }
        if (overflowed.some(item => item.element.contains(focused))) {
            // Focus on a control that just moved into the menu goes to the More button, which now holds it.
            moreButton.focus();
        } else if (focused === moreButton && !showMore) {
            // Everything fits again, so the More button goes; focus moves to the last control.
            const controls = items.filter(item => !item.isSeparator());
            controls[controls.length - 1]?.element.focus();
        }
    }

    #observe(): void {
        // The More button may have changed size with the toolbar's.
        this.#moreWidth = null;
        if (typeof ResizeObserver === "undefined") {
            this.#scheduleLayout();
            return;
        }
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = new ResizeObserver(() => this.#scheduleLayout());
        this.#resizeObserver.observe(this.#hostElement);
        for (const item of this.items()) {
            this.#resizeObserver.observe(item.element);
        }
        this.#scheduleLayout();
    }

    /** Lays out in the next frame, once, however many sizes changed, and outside the resize observer's callback. */
    #scheduleLayout(): void {
        if (this.#layoutFrame != null) {
            return;
        }
        this.#layoutFrame = requestAnimationFrame(() => this.#layout());
    }

    #warnIfUnnamed(): void {
        if (isDevMode() && !this.ariaLabel() && !this.ariaLabelledBy()) {
            console.warn(
                "[Mona Toolbar] A toolbar needs aria-label or aria-labelledby, so assistive technology can say what it's for.",
                this.#hostElement
            );
        }
    }
}
