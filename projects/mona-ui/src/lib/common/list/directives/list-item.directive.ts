import { computed, Directive, inject, input } from "@angular/core";
import { listItemVariants } from "mona-ui/common/list/styles/list.style";
import { twMerge } from "tailwind-merge";
import { ListItem } from "../models/ListItem";
import { ListService } from "../services/list.service";

@Directive({
    selector: "li[monaListItem]",
    standalone: true,
    host: {
        "[attr.aria-current]": "highlighted()",
        "[attr.aria-disabled]": "disabled()",
        "[attr.aria-selected]": "selected()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-highlighted]": "highlighted()",
        "[attr.data-selected]": "selected()",
        "[attr.role]": "'listitem'",
        "[class]": "textClasses()"
    }
})
export class ListItemDirective<TData> {
    readonly #listService = inject(ListService<TData>);
    protected readonly disabled = computed(() => this.#listService.isDisabled(this.item()));
    protected readonly highlighted = computed(() => this.#listService.isHighlighted(this.item()));
    protected readonly selected = computed(() => this.#listService.isSelected(this.item()));
    protected readonly textClasses = computed(() => {
        const classes = listItemVariants();
        return twMerge(classes);
    });
    public readonly item = input.required<ListItem<TData>>();
}
