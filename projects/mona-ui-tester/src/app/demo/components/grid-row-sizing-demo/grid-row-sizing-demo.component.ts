import { Component, signal } from "@angular/core";
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
import {
    GridAddCommandDirective,
    GridCellTemplateDirective,
    GridColumnComponent,
    GridCommandColumnComponent,
    GridComponent,
    GridDetailTemplateDirective,
    GridEditableDirective,
    GridEditTemplateDirective,
    GridGroupableDirective,
    GridRowReorderableDirective,
    GridSelectableDirective,
    GridToolbarTemplateDirective,
    GridVirtualScrollDirective,
    type RowReorderEvent
} from "@nanahoshi/mona-ui/grid";

type UserRow = Record<string, unknown> & { id: number; name: string; role: string };

@Component({
    selector: "app-grid-row-sizing-demo",
    templateUrl: "./grid-row-sizing-demo.component.html",
    imports: [
        AvatarComponent,
        ButtonDirective,
        ChipComponent,
        GridAddCommandDirective,
        GridCellTemplateDirective,
        GridColumnComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridDetailTemplateDirective,
        GridEditableDirective,
        GridEditTemplateDirective,
        GridGroupableDirective,
        GridRowReorderableDirective,
        GridSelectableDirective,
        GridToolbarTemplateDirective,
        GridVirtualScrollDirective
    ]
})
export class GridRowSizingDemoComponent {
    protected readonly directions = ["ltr", "rtl"] as const;
    protected readonly rows = signal<readonly UserRow[]>([
        { id: 1, name: "Sam", role: "Member" },
        { id: 2, name: "Jane Doe", role: "Administrator" },
        { id: 3, name: "Ada Chen", role: "Member" }
    ]);
    protected readonly virtualRows = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i + 1}`,
        team: `Team ${i % 3}`
    }));
    protected readonly newUser = (): UserRow => ({ id: 4, name: "New user", role: "Member" });

    protected onNameInput(event: Event, setValue: (value: unknown) => void): void {
        if (event.target instanceof HTMLInputElement) {
            setValue(event.target.value);
        }
    }

    protected onReorder(event: RowReorderEvent): void {
        this.rows.set(event.reorderedData as readonly UserRow[]);
    }
}
