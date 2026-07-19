import { computed, Directive, ElementRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ListItem } from "../models/ListItem";
import { ListService } from "../services/list.service";
import { listItemContentThemeVariants } from "../styles/list.styles";

@Directive({
    selector: "li[monaListItem]",
    standalone: true,
    host: {
        "[attr.aria-current]": "highlighted()",
        "[attr.aria-disabled]": "disabled()",
        "[attr.aria-posinset]": "position()",
        "[attr.aria-selected]": "selected()",
        "[attr.aria-setsize]": "setSize()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-highlighted]": "highlighted()",
        "[attr.data-selected]": "selected()",
        "[attr.role]": "'option'",
        "[attr.tabindex]": "rovingTabIndex()",
        "[class]": "textClasses()"
    }
})
export class ListItemDirective<TData> {
    readonly #listService = inject(ListService<TData>);
    protected readonly disabled = computed(() => this.#listService.isDisabled(this.item()));
    protected readonly highlighted = computed(() => this.#listService.isHighlighted(this.item()));
    protected readonly position = computed(() => {
        const positionInfo = this.#listService.getItemPosition(this.item());
        return positionInfo?.position ?? null;
    });
    protected readonly rovingTabIndex = computed(() => (this.#listService.focusableItem() === this.item() ? 0 : -1));
    protected readonly selected = computed(() => this.#listService.isSelected(this.item()));
    protected readonly setSize = computed(() => {
        const positionInfo = this.#listService.getItemPosition(this.item());
        return positionInfo?.total ?? null;
    });
    protected readonly textClasses = computed(() => {
        const disabled = this.disabled();
        const highlighted = this.highlighted();
        const selected = this.selected();
        const checkboxes = this.#listService.selectableOptions().checkboxes;
        const classes = listItemContentThemeVariants({
            disabled,
            highlighted,
            selected,
            checkboxes
        });
        return twMerge(classes);
    });
    public readonly item = input.required<ListItem<TData>>();

    public constructor() {
        fromEvent(inject(ElementRef<HTMLElement>).nativeElement, "focusout")
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.#listService.itemFocusOut$.next(this.item()));
    }
}
