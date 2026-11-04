import { FocusTrapFactory } from "@angular/cdk/a11y";
import {
    ChangeDetectionStrategy,
    Component,
    ComponentRef,
    computed,
    ElementRef,
    inject,
    input,
    output,
    viewChild
} from "@angular/core";
import { LucideFunnel } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { DataType } from "@nanahoshi/mona-ui/common";
import type { FilterMenuDateOptions } from "@nanahoshi/mona-ui/filter";
import { FilterMenuComponent } from "@nanahoshi/mona-ui/filter";
import { PopupRef, PopupService } from "@nanahoshi/mona-ui/popup";
import { take } from "rxjs";
import { Column } from "../../models/Column";
import { ColumnFilterState } from "../../models/ColumnFilterState";
import { GridService } from "../../services/grid.service";

/**
 * The funnel button of a filterable column and the filter menu it opens: a dialog named after the column that
 * keeps focus inside until it closes, then returns it to the button.
 */
@Component({
    selector: "mona-grid-filter-menu",
    templateUrl: "./grid-filter-menu.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonDirective, LucideFunnel]
})
export class GridFilterMenuComponent {
    readonly #focusTrapFactory = inject(FocusTrapFactory);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #popupService = inject(PopupService);
    #popupRef?: PopupRef;
    private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>("button");
    /** The button's name, which says when the column is filtered. */
    protected readonly buttonLabel = computed(() => {
        const column = this.column();
        return column.filtered
            ? this.messages().filterByColumnFiltered(column.title)
            : this.messages().filterByColumn(column.title);
    });
    protected readonly messages = this.#gridService.messages;
    public readonly apply = output<ColumnFilterState>();
    public readonly column = input.required<Column>();
    public readonly type = input<DataType>("string");

    /**
     * Opens the menu from the keyboard (Alt+ArrowDown on the header). The button takes focus first, so focus
     * returns to it when the menu closes; Escape then goes back to the header cell.
     */
    public open(): void {
        this.openPopup();
    }

    protected openPopup(): void {
        // Focus returns to the focused element inside the anchor; a click does not focus a button everywhere.
        this.button().nativeElement.focus();
        const popupRef = this.#popupService.create({
            anchor: this.#hostElementRef.nativeElement,
            content: FilterMenuComponent,
            hasBackdrop: true,
            preventClose: event => {
                if (event.originalEvent instanceof MouseEvent) {
                    const target = event.originalEvent.target as HTMLElement;
                    if (target.closest("mona-filter-menu")) {
                        return true;
                    }
                }
                return false;
            }
        });
        this.#popupRef = popupRef;

        const column = this.column();
        const filterState = this.#gridService.appliedFilters().get(column.field);
        const componentRef = popupRef.component as ComponentRef<FilterMenuComponent>;
        const menuElement = componentRef.location.nativeElement as HTMLElement;
        menuElement.setAttribute("role", "dialog");
        menuElement.setAttribute("aria-label", this.messages().filterByColumn(column.title));
        componentRef.setInput("type", this.type());
        componentRef.setInput("field", column.field);
        componentRef.setInput("size", "small");
        if (this.type() === "date") {
            componentRef.setInput("dateOptions", this.#createDateOptions());
        }
        if (filterState?.filterMenuValue) {
            componentRef.instance.value.set(filterState.filterMenuValue);
        }
        componentRef.changeDetectorRef.detectChanges();

        const focusTrap = this.#focusTrapFactory.create(menuElement);
        void focusTrap.focusInitialElementWhenReady();
        popupRef.closed.pipe(take(1)).subscribe(() => focusTrap.destroy());

        componentRef.instance.apply.subscribe(filter => {
            const filterState: ColumnFilterState = {
                filter,
                filterMenuValue: componentRef.instance.getFilterValues()
            };
            this.#popupRef?.close();
            this.apply.emit(filterState);
        });
    }

    /** The column's string `format`, or none, so the date picker uses the locale's date format. */
    #createDateOptions(): FilterMenuDateOptions {
        const format = this.column().format;
        return typeof format === "string" ? { format } : {};
    }
}
