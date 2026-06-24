import { ChangeDetectionStrategy, Component, ComponentRef, ElementRef, inject, input, output } from "@angular/core";
import { FunnelIcon, LucideAngularModule } from "lucide-angular";
import { take } from "rxjs";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { FilterMenuComponent } from "../../../filter/components/filter-menu/filter-menu.component";
import type { FilterMenuDateOptions, FilterMenuDateType } from "../../../filter/models/FilterMenuDateOptions";
import { FilterService } from "../../../filter/services/filter.service";
import { DataType } from "../../../models/DataType";
import { PopupRef } from "../../../popup/models/PopupRef";
import { PopupService } from "../../../popup/services/popup.service";
import { Column } from "../../models/Column";
import { ColumnFilterState } from "../../models/ColumnFilterState";
import { GridService } from "../../services/grid.service";

@Component({
    selector: "mona-grid-filter-menu",
    templateUrl: "./grid-filter-menu.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonDirective, LucideAngularModule]
})
export class GridFilterMenuComponent {
    readonly #filterService = inject(FilterService);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #popupService = inject(PopupService);
    #popupRef?: PopupRef;
    protected readonly filterIcon = FunnelIcon;
    public readonly apply = output<ColumnFilterState>();
    public readonly column = input.required<Column>();
    public readonly type = input<DataType>("string");

    protected openPopup(): void {
        this.#popupRef = this.#popupService.create({
            anchor: this.#hostElementRef.nativeElement,
            content: FilterMenuComponent,
            closeOnBackdropClick: false,
            hasBackdrop: true,
            preventClose: event => {
                if (event.originalEvent instanceof MouseEvent) {
                    const target = event.originalEvent.target as HTMLElement;
                    if (target.closest("mona-filter-menu")) {
                        return true;
                    }
                }
                return false;
            },
            providers: [{ provide: FilterService, useValue: this.#filterService }]
        });
        this.#popupRef.overlayRef
            .backdropClick()
            .pipe(take(1))
            .subscribe(() => this.#popupRef?.close());

        const filterState = this.#gridService.appliedFilters().get(this.column().field);
        const componentRef = this.#popupRef.component as ComponentRef<FilterMenuComponent>;
        componentRef.instance.type.set(this.type());
        componentRef.instance.field.set(this.column().field);
        componentRef.setInput("size", "small");
        const dateOptions = this.#createDateOptions();
        if (dateOptions != null) {
            componentRef.setInput("dateOptions", dateOptions);
        }
        if (filterState?.filterMenuValue) {
            componentRef.instance.value.set(filterState.filterMenuValue);
        }
        componentRef.changeDetectorRef.detectChanges();
        componentRef.instance.apply.subscribe(filter => {
            const filterState: ColumnFilterState = {
                filter,
                filterMenuValue: componentRef.instance.getFilterValues()
            };
            this.#popupRef?.close();
            this.apply.emit(filterState);
        });
    }

    #createDateOptions(): FilterMenuDateOptions | null {
        const type = this.type();
        if (type !== "date") {
            return null;
        }
        const format = this.column().format;
        return {
            format: typeof format === "string" ? format : this.#getDefaultDateFormat(type),
            type
        };
    }

    #getDefaultDateFormat(type: FilterMenuDateType): string {
        switch (type) {
            case "datetime":
                return "dd/MM/yyyy HH:mm";
            case "time":
                return "HH:mm";
            case "date":
                return "dd/MM/yyyy";
            default:
                return "dd/MM/yyyy";
        }
    }
}
