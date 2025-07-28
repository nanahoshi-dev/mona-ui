import { Component, computed, contentChildren, DestroyRef, inject, input, viewChild } from "@angular/core";
import { selectMany } from "@mirei/ts-collections";
import { prepareMenuItems } from "../../../menus/utils/menu.utils";
import { ButtonVariantProps, DropdownButtonVariantInputs } from "../../button/styles/button.styles";
import { MenuItemGroupComponent } from "../../../menus/menu-item-group/menu-item-group.component";
import { MenuItemInjectionToken } from "../../../menus/models/MenuItemInjectionToken";
import { ContextMenuComponent } from "../../../menus/contextmenu/components/context-menu/context-menu.component";
import { MenuItemComponent } from "../../../menus/menu-item/menu-item.component";
import { ButtonDirective } from "../../button/directives/button.directive";

@Component({
    selector: "mona-drop-down-button",
    templateUrl: "./drop-down-button.component.html",
    imports: [ButtonDirective, ContextMenuComponent],
    host: {
        "[class.mona-drop-down-button]": "true"
    }
})
export class DropDownButtonComponent implements DropdownButtonVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    #resizeObserver: ResizeObserver | null = null;
    protected readonly menuItemComponents = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken
    );
    protected readonly menuItems = computed(() =>
        selectMany(prepareMenuItems(this.menuItemComponents()), i => i).toImmutableSet()
    );

    /**
     * @description Sets the disabled state of the button.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the look of the button.
     */
    public readonly look = input<ButtonVariantProps["look"]>("default");

    /**
     * @description Sets the border radius of the button.
     */
    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the button.
     */
    public readonly size = input<ButtonVariantProps["size"]>("medium");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        this.#destroyRef.onDestroy(() => {
            this.#resizeObserver?.disconnect();
        });
    }
}
