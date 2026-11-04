import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import type { EditableOptions } from "../models/EditableOptions";
import { GridService } from "../services/grid.service";
import { GridEditableDirective } from "./grid-editable.directive";

@Component({
    imports: [GridColumnComponent, GridComponent, GridEditableDirective],
    template: `
        <mona-grid ariaLabel="Orders" [data]="rows" [monaGridEditable]="options()">
            <mona-grid-column field="name" title="Name"></mona-grid-column>
        </mona-grid>
    `
})
class HostComponent {
    public readonly options = signal<EditableOptions | "">("");
    public readonly rows = [{ name: "Ann" }];
}

describe("GridEditableDirective", () => {
    function setup(): { host: HostComponent; service: () => EditableOptions; detect: () => void } {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        const service = fixture.debugElement.children[0].injector.get(GridService);
        return {
            detect: () => fixture.detectChanges(),
            host: fixture.componentInstance,
            service: () => service.editableOptions()
        };
    }

    it("turns cell editing on with the bare attribute", () => {
        const { service } = setup();
        expect(service()).toEqual(expect.objectContaining({ enabled: true, mode: "cell" }));
    });

    it("passes its options to the grid and follows changes", () => {
        const { detect, host, service } = setup();
        host.options.set({ mode: "row" });
        detect();
        expect(service()).toEqual(expect.objectContaining({ enabled: true, mode: "row" }));

        host.options.set({ enabled: false, mode: "row" });
        detect();
        expect(service().enabled).toBe(false);
    });
});
