import { Component, computed, DestroyRef, inject, linkedSignal, output, signal } from "@angular/core";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { FilterInputComponent } from "../../../common/filter-input/components/filter-input/filter-input.component";
import { ListViewFooterTemplateDirective } from "../../../list-view/directives/list-view-footer-template.directive";
import { ListViewHeaderTemplateDirective } from "../../../list-view/directives/list-view-header-template.directive";
import { ListViewComponent } from "../../../list-view/components/list-view/list-view.component";
import { ListViewSelectableDirective } from "../../../list-view/directives/list-view-selectable.directive";
import { GridService } from "../../services/grid.service";

@Component({
    selector: "mona-grid-column-chooser",
    imports: [
        ListViewComponent,
        ListViewHeaderTemplateDirective,
        FilterInputComponent,
        ButtonDirective,
        ListViewSelectableDirective,
        ListViewFooterTemplateDirective
    ],
    templateUrl: "./grid-column-chooser.component.html"
})
export class GridColumnChooserComponent {
    readonly #gridService = inject(GridService);
    protected readonly columnListSource = computed(() => {
        const columns = this.#gridService.columns();
        const source = columns.select(c => ({ field: c.field, title: c.title }));
        const filterText = this.filterText();
        if (!filterText) {
            return source.toImmutableSet();
        }
        return source.where(item => item.title.toLowerCase().includes(filterText.toLowerCase())).toImmutableSet();
    });
    protected readonly filterText = signal("");
    protected readonly selectedColumns = computed(() =>
        this.#gridService
            .columns()
            .where(c => !c.hidden)
            .toImmutableSet()
    );
    protected readonly selectedColumnFields = linkedSignal(() =>
        this.selectedColumns()
            .select(c => c.field)
            .toImmutableSet()
    );
    public readonly apply = output<void>();
    public readonly cancel = output<void>();

    public constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.filterText.set("");
        });
    }

    protected onApplyClick(): void {
        this.#gridService.setColumnVisibilityByFields(this.selectedColumnFields());
        this.apply.emit();
        this.#clear();
    }

    protected onCancelClick(): void {
        this.cancel.emit();
        this.#clear();
        this.selectedColumnFields.set(
            this.selectedColumns()
                .select(c => c.field)
                .toImmutableSet()
        );
    }

    protected onSelectedKeysChange(keys: readonly string[]) {
        this.selectedColumnFields.update(set => set.reset(keys));
    }

    #clear(): void {
        this.filterText.set("");
    }
}
