import { Component } from "@angular/core";
import {
    GridColumnComponent,
    GridComponent,
    GridDetailTemplateDirective,
    GridGroupableDirective,
    GridSelectableDirective
} from "@nanahoshi/mona-ui/grid";
import { GridRowSizingDemoComponent } from "./grid-row-sizing-fixture/grid-row-sizing-demo.component";
import { GridServerBindingDemoComponent } from "./grid-server-binding-fixture/grid-server-binding-demo.component";

@Component({
    imports: [
        GridColumnComponent,
        GridComponent,
        GridDetailTemplateDirective,
        GridGroupableDirective,
        GridRowSizingDemoComponent,
        GridSelectableDirective,
        GridServerBindingDemoComponent
    ],
    template: `<main class="p-6 max-w-5xl mx-auto">
        <h1>Grid behavior checks</h1>
        <app-grid-server-binding-demo /><app-grid-row-sizing-demo />
        <section id="grouped-detail" class="my-6">
            <h2 class="font-medium mb-2">Grouped rows with details</h2>
            <mona-grid
                class="h-96 w-full"
                [data]="groupedRows"
                [pageSize]="10"
                [resizeMethod]="'fitView'"
                [monaGridGroupable]="{ enabled: true, showFooter: false }"
                [group]="[{ field: 'team' }, { field: 'role' }]"
                [monaGridSelectable]="{ enabled: true, mode: 'multiple', showCheckboxes: true }"
                selectBy="id">
                <mona-grid-column field="name" title="User" />
                <mona-grid-column field="team" title="Team" />
                <mona-grid-column field="role" title="Role" />
                <ng-template monaGridDetailTemplate let-user>
                    <div class="p-4" data-grouped-detail>Details for {{ user.name }}</div>
                </ng-template>
            </mona-grid>
        </section>
    </main>`
})
export class GridGeometryFixtureComponent {
    protected readonly groupedRows = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        name: `User ${i + 1}`,
        role: i % 2 === 0 ? "Member" : "Owner",
        team: `Team ${i % 3}`
    }));
}
