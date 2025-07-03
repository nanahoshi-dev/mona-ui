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
    splitButtonThemeVariants,
    SplitButtonVariantInputs,
    SplitButtonVariantProps
} from "mona-ui/buttons/split-button/styles/split-button.styles";
import { MenuItemGroupComponent } from "mona-ui/menus/menu-item-group/menu-item-group.component";
import { MenuItemInjectionToken } from "mona-ui/menus/models/MenuItemInjectionToken";
import { prepareMenuItems } from "mona-ui/menus/utils/prepareMenuItems";
import { ThemeService } from "mona-ui/theme/services/theme.service";
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
    readonly #themeService = inject(ThemeService);
    protected readonly buttonClick = output<MouseEvent>();
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
    protected readonly contextMenuComponent = viewChild.required<ContextMenuComponent>("contextMenuComponent");
    protected readonly mainButtonElementRef = viewChild.required<ElementRef>("mainButton");
    protected readonly menuIcon = ChevronDown;
    protected readonly menuItemComponents = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken
    );
    protected readonly menuItems = computed(() =>
        selectMany(prepareMenuItems(this.menuItemComponents()), i => i).toImmutableSet()
    );
    protected readonly popupOffset = signal<PopupOffset>({ horizontal: -1, vertical: 4 });
    protected readonly textTemplate = contentChild(SplitButtonTextTemplateDirective, { read: TemplateRef });

    /**
     * @description Sets the disabled state of the button.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the look of the button.
     */
    public readonly look = input<SplitButtonVariantProps["look"]>("default");

    /**
     * @description Sets the width of the popup.
     */
    public readonly popupWidth = input(0);

    /**
     * @description Sets the border radius of the button.
     */
    public readonly rounded = input<SplitButtonVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the button.
     */
    public readonly size = input<SplitButtonVariantProps["size"]>("medium");

    /**
     * @description Sets the tabindex of the button.
     */
    public readonly tabindex = input<number | string>(0);

    /**
     * @description Sets the text of the button.
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
                this.popupOffset.update(value => ({
                    ...value,
                    horizontal: -mainButtonElement.getBoundingClientRect().width
                }));
            }
        });
    }
}
