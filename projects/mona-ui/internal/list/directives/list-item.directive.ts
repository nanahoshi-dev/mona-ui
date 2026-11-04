import { computed, Directive, ElementRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ListItem } from "../models/ListItem";
import { ListService } from "../services/list.service";
import { listItemContentThemeVariants } from "../styles/list.styles";

@Directive({
    selector: "li[monaListItem]",
    host: {
        "[attr.aria-describedby]": "groupHeaderUid()",
        "[attr.aria-disabled]": "isOption() ? disabled() : null",
        "[attr.aria-posinset]": "position()",
        "[attr.aria-selected]": "isOption() ? selected() : null",
        "[attr.aria-setsize]": "setSize()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-highlighted]": "highlighted()",
        "[attr.data-selected]": "selected()",
        "[attr.role]": "isOption() ? 'option' : 'listitem'",
        "[attr.tabindex]": "rovingTabIndex()",
        "[class]": "textClasses()"
    }
})
export class ListItemDirective<TData> {
    readonly #listService = inject(ListService<TData>);
    protected readonly disabled = computed(() => this.#listService.isDisabled(this.item()));
    /**
     * Without virtual scrolling, items sit inside a group labelled by its header. A virtual list stays flat, so each
     * item points at its header instead.
     */
    protected readonly groupHeaderUid = computed(() =>
        this.#listService.virtualScrollOptions().enabled ? this.#listService.getGroupHeaderUid(this.item()) : null
    );
    protected readonly highlighted = computed(() => this.#listService.isHighlighted(this.item()));
    protected readonly isOption = computed(() => this.#listService.role() === "listbox");
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
        const selectableOptions = this.#listService.selectableOptions();
        const checkboxes = selectableOptions.checkboxes;
        const classes = listItemContentThemeVariants({
            disabled,
            highlighted,
            selected,
            checkboxes,
            selectable: selectableOptions.enabled
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
