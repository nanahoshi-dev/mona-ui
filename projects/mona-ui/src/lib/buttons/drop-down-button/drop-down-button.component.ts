import { ConnectedPosition } from "@angular/cdk/overlay";
import {
    AfterViewInit,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    inject,
    input,
    signal,
    Signal,
    viewChild
} from "@angular/core";
import { ButtonVariantProps, DropdownButtonVariantInputs } from "mona-ui/buttons/button/button.style";
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
export class DropDownButtonComponent implements AfterViewInit, DropdownButtonVariantInputs {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    #resizeObserver: ResizeObserver | null = null;
    protected readonly contextMenuComponent: Signal<ContextMenuComponent> = viewChild.required("contextMenuComponent");
    protected readonly menuItemComponents: Signal<readonly MenuItemComponent[]> = contentChildren(MenuItemComponent);
    protected readonly menuItems = computed(() => this.menuItemComponents().map(m => m.getMenuItem()));
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
    public readonly disabled = input(false);
    public readonly look = input<ButtonVariantProps["look"]>("default");
    public readonly size = input<ButtonVariantProps["size"]>("default");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        this.#destroyRef.onDestroy(() => {
            this.#resizeObserver?.disconnect();
        });
    }

    public ngAfterViewInit(): void {
        window.setTimeout(() => {
            this.contextMenuComponent().setPrecise(false);
        });
    }
}
