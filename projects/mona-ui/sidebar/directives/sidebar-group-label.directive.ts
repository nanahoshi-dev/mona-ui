import { computed, DestroyRef, Directive, ElementRef, inject } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { SidebarService } from "../services/sidebar.service";
import { sidebarGroupLabelThemeVariants } from "../styles/sidebar.styles";
import { SidebarGroupDirective } from "./sidebar-group.directive";

/**
 * @description
 * The name of a group, which the enclosing `monaSidebarGroup` is labelled by. Fades out on the icon
 * rail, where there is no width to read it in.
 */
@Directive({
    selector: "[monaSidebarGroupLabel]",
    host: {
        "[attr.id]": "id",
        "[class]": "baseClass()"
    }
})
export class SidebarGroupLabelDirective {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #group = inject(SidebarGroupDirective, { optional: true });
    readonly #sidebarService = inject(SidebarService, { optional: true });

    // Faded rather than removed from the layout: the header around it closes by height over the same
    // interval, so dropping the label outright would empty the row before it had finished shrinking.
    // `visibility` follows the fade so it leaves the accessibility tree with it.
    protected readonly baseClass = computed(() =>
        sidebarGroupLabelThemeVariants({ hidden: this.#sidebarService?.iconOnly() ?? false })
    );
    protected readonly id = this.#element.id || createElementControlId();

    public constructor() {
        this.#group?.labelId.set(this.id);
        inject(DestroyRef).onDestroy(() => this.#group?.labelId.set(null));
    }
}
