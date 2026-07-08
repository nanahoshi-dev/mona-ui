import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, TemplateRef } from "@angular/core";
import { ImmutableDictionary } from "@mirei/ts-collections";
import { Column } from "../../models/Column";
import type { GridAggregateBucket } from "../../models/GridAggregate";
import { GridService } from "../../services/grid.service";

interface GridFooterTemplateContext {
    readonly $implicit: unknown;
    readonly aggregate: GridAggregateBucket | null;
    readonly aggregates: Readonly<Record<string, GridAggregateBucket>>;
    readonly column: Column;
    readonly columnIndex: number;
    readonly rows: readonly Record<PropertyKey, unknown>[];
}

interface GridGroupFooterTemplateContext extends GridFooterTemplateContext {
    readonly count: number;
    readonly depth: number;
    readonly groupKey: string;
    readonly groupValue: unknown;
}

@Component({
    selector: "mona-grid-footer-cell",
    template: `
        @if (templateRef(); as templateRef) {
            <ng-container [ngTemplateOutlet]="templateRef" [ngTemplateOutletContext]="templateContext()"></ng-container>
        } @else if (displayValue() != null) {
            <span class="block truncate font-medium">{{ displayValue() }}</span>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet]
})
export class GridFooterCellComponent {
    readonly #gridService = inject(GridService);
    protected readonly aggregate = computed(() => {
        const field = this.column().field;
        const groupKey = this.groupKey();
        if (groupKey == null) {
            return this.aggregateMap().get(field) ?? null;
        }
        return this.#gridService.groupAggregateMap().get(groupKey)?.aggregates.get(field) ?? null;
    });
    protected readonly aggregateMap = computed(() => {
        const groupKey = this.groupKey();
        if (groupKey == null) {
            return this.#gridService.aggregateMap();
        }
        return (
            this.#gridService.groupAggregateMap().get(groupKey)?.aggregates ??
            ImmutableDictionary.create<string, GridAggregateBucket>()
        );
    });
    protected readonly displayValue = computed(() => {
        return this.#gridService.resolveAggregateValue(this.aggregate(), this.column().aggregate);
    });
    protected readonly templateContext = computed<GridFooterTemplateContext | GridGroupFooterTemplateContext>(() => {
        const column = this.column();
        const columnIndex = this.columnIndex();
        const aggregate = this.aggregate();
        const aggregates = this.aggregateMap().toObject(
            e => e.key,
            e => e.value
        );
        const value = this.displayValue();
        const groupKey = this.groupKey();
        if (groupKey == null) {
            return {
                $implicit: value,
                aggregate,
                aggregates,
                column,
                columnIndex,
                rows: this.#gridService.aggregateRows()
            };
        }
        const groupFooterAggregate = this.#gridService.groupAggregateMap().get(groupKey);
        return {
            $implicit: value,
            aggregate,
            aggregates,
            column,
            columnIndex,
            count: groupFooterAggregate?.count ?? 0,
            depth: groupFooterAggregate?.depth ?? 0,
            groupKey,
            groupValue: groupFooterAggregate?.groupValue,
            rows: groupFooterAggregate?.rows ?? []
        };
    });
    protected readonly templateRef = computed<TemplateRef<unknown> | null>(() => {
        if (this.groupKey() != null) {
            return this.column().groupFooterTemplate;
        }
        return this.column().footerTemplate;
    });

    public readonly column = input.required<Column>();
    public readonly columnIndex = input.required<number>();
    public readonly groupKey = input<string | null>(null);
}
