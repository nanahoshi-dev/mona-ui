import { Highlightable } from "@angular/cdk/a11y";
import { NgClass, NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, OnDestroy } from "@angular/core";
import { ChevronRight, LucideAngularModule } from "lucide-angular";
import {
    contextMenuItemVariants,
    menuItemIconVariants,
    menuItemLinkVariants,
    menuItemShortcutVariants,
    menuItemTextVariants
} from "mona-ui/menus/styles/menu.style";
import { twMerge } from "tailwind-merge";
import { PopupRef } from "../../popup/models/PopupRef";
import { MenuItem } from "../models/MenuItem";

@Component({
    selector: "mona-contextmenu-item",
    templateUrl: "./context-menu-item.component.html",
    imports: [NgClass, NgTemplateOutlet, LucideAngularModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.data-disabled]": "itemDisabled()||undefined",
        "[attr.data-focused]": "itemFocused()||undefined",
        "[class]": "classes()"
    }
})
export class ContextMenuItemComponent implements OnDestroy, Highlightable {
    protected readonly classes = computed(() => {
        return twMerge(contextMenuItemVariants());
    });
    protected readonly iconContainerClasses = computed(() => {
        return twMerge(menuItemIconVariants());
    });
    protected readonly linkContainerClasses = computed(() => {
        return twMerge(menuItemLinkVariants());
    });
    protected readonly linkIcon = ChevronRight;
    protected readonly shortcutContainerClasses = computed(() => {
        return twMerge(menuItemShortcutVariants());
    });
    protected readonly textContainerClasses = computed(() => {
        return twMerge(menuItemTextVariants());
    });
    public readonly elementRef = inject(ElementRef<HTMLElement>);
    public readonly itemDisabled = input(false);
    public readonly itemFocused = input(false);
    public readonly menuItem = input.required<MenuItem>();
    public readonly submenuPopupRef = input<PopupRef | null>(null);

    public ngOnDestroy(): void {
        this.submenuPopupRef()?.close();
    }

    public setActiveStyles(): void {}

    public setInactiveStyles(): void {}
}
