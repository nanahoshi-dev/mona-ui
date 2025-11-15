import { computed, Directive, effect, ElementRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { listItemVariants } from "../styles/list.styles";
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
        const disabled = this.disabled();
        const highlighted = this.highlighted();
        const selected = this.selected();
        const classes = listItemVariants({ disabled, highlighted, selected });
        return twMerge(classes);
    });
    public readonly item = input.required<ListItem<TData>>();

    public constructor() {
        fromEvent(inject(ElementRef<HTMLElement>).nativeElement, "focusout")
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.#listService.itemFocusOut$.next(this.item()));
    }
}
