import { Component } from "@angular/core";
import { GridRowSizingDemoComponent } from "../demo/components/grid-row-sizing-demo/grid-row-sizing-demo.component";
import { GridServerBindingDemoComponent } from "../demo/components/grid-server-binding-demo/grid-server-binding-demo.component";

@Component({
    imports: [GridRowSizingDemoComponent, GridServerBindingDemoComponent],
    template: `<main class="p-6 max-w-5xl mx-auto">
        <h1>Grid behavior checks</h1>
        <app-grid-server-binding-demo /><app-grid-row-sizing-demo />
    </main>`
})
export class GridGeometryFixtureComponent {}
