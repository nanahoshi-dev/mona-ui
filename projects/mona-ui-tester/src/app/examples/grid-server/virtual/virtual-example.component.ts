import { Component, signal } from "@angular/core";
import { GridColumnComponent, GridComponent, GridVirtualScrollDirective } from "@nanahoshi/mona-ui/grid";

interface Reading {
    id: number;
    sensor: string;
    temperature: number;
}

function readings(from: number, count: number): Reading[] {
    return Array.from({ length: count }, (_, offset) => {
        const id = from + offset;
        return { id, sensor: `Sensor ${(id % 12) + 1}`, temperature: 18 + ((id * 7) % 90) / 10 };
    });
}

@Component({
    selector: "app-grid-server-virtual-example",
    imports: [GridColumnComponent, GridComponent, GridVirtualScrollDirective],
    templateUrl: "./virtual-example.component.html"
})
export class GridVirtualExampleComponent {
    protected readonly rows = signal(readings(1, 500));

    /** Adds the next 500 readings when the last rows come into view, up to 5,000. */
    protected onScrollEnd(): void {
        const current = this.rows();
        if (current.length < 5000) {
            this.rows.set([...current, ...readings(current.length + 1, 500)]);
        }
    }
}
