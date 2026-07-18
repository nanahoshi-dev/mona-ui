import { TestBed } from "@angular/core/testing";
import { gridCellBaseVariants, gridListTableCellVariants } from "../styles/grid.mona.styles";
import { GridCellDirective } from "./grid-cell.directive";

describe("GridCellDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({});
        const directive = TestBed.runInInjectionContext(() => new GridCellDirective());
        expect(directive).toBeTruthy();
    });

    it("uses layout-neutral subtle separators and a semantic cell focus indicator", () => {
        const cellContentClasses = gridCellBaseVariants();
        const tableCellClasses = gridListTableCellVariants({ lastInRow: false });

        expect(cellContentClasses).toContain("shadow-[inset_0_-1px_0_0_var(--color-border-subtle)]");
        expect(cellContentClasses).not.toContain("border-b");
        expect(tableCellClasses).toContain("border-r-border-subtle");
        expect(tableCellClasses).toContain("focus:after:ring-focus-indicator/35");
        expect(tableCellClasses).not.toContain("ring-primary");
    });
});
