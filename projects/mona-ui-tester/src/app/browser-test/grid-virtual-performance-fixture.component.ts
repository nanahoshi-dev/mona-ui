import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { Component, DOCUMENT, inject, signal } from "@angular/core";
import { GridColumnComponent, GridComponent, GridVirtualScrollDirective } from "@nanahoshi/mona-ui/grid";

interface FileEntry {
    readonly modified: string;
    readonly name: string;
    readonly path: string;
    readonly size: number;
}

let nextFileId = 0;

function createFiles(count: number): FileEntry[] {
    return Array.from({ length: count }, () => {
        const id = nextFileId++;
        return {
            modified: `2026-11-${String((id % 28) + 1).padStart(2, "0")} 10:${String(id % 60).padStart(2, "0")}`,
            name: `File ${String(id).padStart(6, "0")}.txt`,
            path: `C:\\Files\\${id}`,
            size: (id * 37) % 100_000
        };
    });
}

/**
 * A folder of 50,000 files in a virtual grid, or in a plain CDK virtual list to compare against, for
 * `scripts/bench-grid-virtual-scroll.ts`. `?mode=cdk` shows the list. The buttons swap in data built beforehand,
 * so a measurement covers what the grid does with it and not the building.
 */
@Component({
    imports: [
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        CdkVirtualScrollViewport,
        GridColumnComponent,
        GridComponent,
        GridVirtualScrollDirective
    ],
    templateUrl: "./grid-virtual-performance-fixture.component.html"
})
export class GridVirtualPerformanceFixtureComponent {
    #prepared: FileEntry[] = [];
    protected readonly files = signal<FileEntry[]>(createFiles(50_000));
    protected readonly mode = new URLSearchParams(inject(DOCUMENT).location.search).get("mode");

    protected apply(): void {
        this.files.set(this.#prepared);
    }

    protected prepareAppend(): void {
        this.#prepared = [...this.files(), ...createFiles(1_000)];
    }

    protected prepareClear(): void {
        this.#prepared = [];
    }

    protected prepareReplace(): void {
        this.#prepared = createFiles(50_000);
    }
}
