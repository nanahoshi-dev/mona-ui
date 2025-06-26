import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    contentChildren,
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
import { selectMany } from "@mirei/ts-collections";
import { ChevronDown, LucideAngularModule } from "lucide-angular";
import {
    ButtonVariantProps,
    SplitButtonVariantInputs,
    splitButtonVariants
} from "mona-ui/buttons/button/styles/button.shadcn.styles";
import { MenuItemGroupComponent } from "mona-ui/menus/menu-item-group/menu-item-group.component";
import { MenuItemInjectionToken } from "mona-ui/menus/models/MenuItemInjectionToken";
import { prepareMenuItems } from "mona-ui/menus/utils/prepareMenuItems";
import { twMerge } from "tailwind-merge";
import { ContextMenuComponent } from "../../../../menus/context-menu/context-menu.component";
import { MenuItemComponent } from "../../../../menus/menu-item/menu-item.component";
import { PopupOffset } from "../../../../popup/models/PopupOffset";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { SplitButtonTextTemplateDirective } from "../../directives/split-button-text-template.directive";

@Component({
    selector: "mona-split-button",
    templateUrl: "./split-button.component.html",
    imports: [ButtonDirective, NgTemplateOutlet, ContextMenuComponent, LucideAngularModule],
    host: {
        "[class]": "classes()",
        "[class.mona-split-button]": "true",
        "[attr.tabindex]": "-1"
    }
})
export class SplitButtonComponent implements SplitButtonVariantInputs {
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    protected readonly buttonClick = output<MouseEvent>();
    protected readonly classes = computed(() => {
        const classes = splitButtonVariants();
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly contextMenuComponent = viewChild.required<ContextMenuComponent>("contextMenuComponent");
    protected readonly mainButtonElementRef = viewChild.required<ElementRef>("mainButton");
    protected readonly menuIcon = ChevronDown;
    protected readonly menuItemComponents = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken
    );
    protected readonly menuItems = computed(() =>
        selectMany(prepareMenuItems(this.menuItemComponents()), i => i).toImmutableSet()
    );
    protected readonly textTemplate = contentChild(SplitButtonTextTemplateDirective, { read: TemplateRef });

    /**
     * Sets the disabled state of the button.
     */
    public readonly disabled = input(false);

    /**
     * Sets the look of the button.
     */
    public readonly look = input<ButtonVariantProps["look"]>("default");
    public readonly popupOffset = signal<PopupOffset>({ horizontal: -1, vertical: 4 });
    public readonly popupWidth = signal(0);

    /**
     * Sets the border radius of the button.
     */
    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");

    /**
     * Sets the size of the button.
     */
    public readonly size = input<ButtonVariantProps["size"]>("medium");

    /**
     * Sets the tabindex of the button.
     */
    public readonly tabindex = input<number | string>(0);

    /**
     * Sets the text of the button.
     */
    public readonly text = input("");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => {
            const contextMenuComponent = this.contextMenuComponent();
            untracked(() => {
                if (contextMenuComponent) {
                    contextMenuComponent.setPrecise(false);
                }
            });
        });
        afterNextRender(() => {
            const mainButtonElement = this.mainButtonElementRef().nativeElement;
            if (mainButtonElement) {
                this.popupWidth.set(this.#hostElementRef.nativeElement.getBoundingClientRect().width - 1);
                this.popupOffset.update(value => ({
                    ...value,
                    horizontal: -mainButtonElement.getBoundingClientRect().width
                }));
            }
        });
    }
}
