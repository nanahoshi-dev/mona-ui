import { ConnectedPosition } from "@angular/cdk/overlay";
import {
    afterNextRender,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    inject,
    input,
    signal,
    viewChild
} from "@angular/core";
import { selectMany } from "@mirei/ts-collections";
import { ButtonVariantProps, DropdownButtonVariantInputs } from "mona-ui/buttons/styles/button.style";
import { MenuItemGroupComponent } from "mona-ui/menus/menu-item-group/menu-item-group.component";
import { MenuItemInjectionToken } from "mona-ui/menus/models/MenuItemInjectionToken";
import { prepareMenuItems } from "mona-ui/menus/utils/prepareMenuItems";
import { ContextMenuComponent } from "../../menus/context-menu/context-menu.component";
import { MenuItemComponent } from "../../menus/menu-item/menu-item.component";
import { ButtonDirective } from "../button/button.directive";

@Component({
    selector: "mona-drop-down-button",
    templateUrl: "./drop-down-button.component.html",
    imports: [ButtonDirective, ContextMenuComponent],
    host: {
        "[class.mona-drop-down-button]": "true"
    }
})
export class DropDownButtonComponent implements DropdownButtonVariantInputs {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    #resizeObserver: ResizeObserver | null = null;
    protected readonly contextMenuComponent = viewChild.required<ContextMenuComponent>("contextMenuComponent");
    protected readonly menuItemComponents = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken
    );
    protected readonly menuItems = computed(() =>
        selectMany(prepareMenuItems(this.menuItemComponents()), i => i).toImmutableSet()
    );
    protected readonly positions = signal<ConnectedPosition[]>([
        {
            originX: "center",
            originY: "bottom",
            overlayX: "center",
            overlayY: "top"
        },
        {
            originX: "center",
            originY: "top",
            overlayX: "center",
            overlayY: "bottom"
        },
        {
            originX: "start",
            originY: "center",
            overlayX: "end",
            overlayY: "center"
        },
        {
            originX: "end",
            originY: "center",
            overlayX: "start",
            overlayY: "center"
        }
    ]);

    /**
     * Sets the disabled state of the button.
     */
    public readonly disabled = input(false);

    /**
     * Sets the look of the button.
     */
    public readonly look = input<ButtonVariantProps["look"]>("default");

    /**
     * Sets the size of the button.
     */
    public readonly size = input<ButtonVariantProps["size"]>("default");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        this.#destroyRef.onDestroy(() => {
            this.#resizeObserver?.disconnect();
        });
        afterNextRender(() => {
            this.contextMenuComponent().setPrecise(false);
        });
    }
}
