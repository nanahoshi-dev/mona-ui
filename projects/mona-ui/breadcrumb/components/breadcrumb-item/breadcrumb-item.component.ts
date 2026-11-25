import {
    booleanAttribute,
    Component,
    computed,
    contentChild,
    forwardRef,
    inject,
    input,
    output,
    TemplateRef,
    viewChild
} from "@angular/core";
import { DropTargetDirective } from "@nanahoshi/mona-ui/drag-drop";
import { BreadcrumbLinkDirective } from "../../directives/breadcrumb-link.directive";
import { BREADCRUMB_CONTEXT, BREADCRUMB_ITEM_CONTEXT } from "../../models/breadcrumb.tokens";

/**
 * Use as a direct child of `<mona-breadcrumb>`. Project any Angular content — text, icons, or elements — into the
 * default slot. With `monaDropTarget`, the item is a place to drop what is dragged, as a file explorer's address bar
 * takes files onto its folders.
 */
@Component({
    selector: "mona-breadcrumb-item",
    templateUrl: "./breadcrumb-item.component.html",
    providers: [{ provide: BREADCRUMB_ITEM_CONTEXT, useExisting: forwardRef(() => BreadcrumbItemComponent) }]
})
export class BreadcrumbItemComponent {
    readonly #breadcrumb = inject(BREADCRUMB_CONTEXT, { optional: true });
    /**
     * @internal
     */
    public readonly current = computed(() => this.#breadcrumb?.currentItem() === this);
    /**
     * @description Renders this item with reduced visual emphasis and removes pointer interaction.
     * Has no visual effect when the parent breadcrumb is also disabled.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });
    /**
     * @internal
     * The item's `monaDropTarget`, which the breadcrumb puts on the item it renders.
     */
    public readonly dropTarget = inject(DropTargetDirective, { optional: true, self: true });
    /**
     * @internal
     */
    public readonly effectiveDisabled = computed(() => !!this.#breadcrumb?.disabled() || this.disabled());
    /**
     * @description Emitted with the click when the item is clicked or activated via keyboard.
     * Not emitted when this is the current-page item or when the item is disabled.
     */
    public readonly itemClick = output<MouseEvent>();
    /**
     * @internal
     */
    public readonly link = contentChild(BreadcrumbLinkDirective);
    /**
     * @internal
     */
    public readonly templateRef = viewChild.required(TemplateRef);
}
