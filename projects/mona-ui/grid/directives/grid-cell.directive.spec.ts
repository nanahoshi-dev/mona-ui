import { TestBed } from "@angular/core/testing";
import { gridCellBaseThemeVariants, gridListTableCellThemeVariants } from "../styles/grid.styles";
import { GridCellDirective } from "./grid-cell.directive";

describe("GridCellDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({});
        const directive = TestBed.runInInjectionContext(() => new GridCellDirective());
        expect(directive).toBeTruthy();
    });

    it("uses layout-neutral subtle separators and a semantic cell focus indicator", () => {
        const cellContentClasses = gridCellBaseThemeVariants();
        const tableCellClasses = gridListTableCellThemeVariants({ lastInRow: false });

        expect(cellContentClasses).not.toContain("shadow-[inset_0_-1px_0_0_var(--color-border-subtle)]");
        expect(cellContentClasses).not.toContain("border-b");
        expect(tableCellClasses).toContain("border-b-border-subtle");
        expect(tableCellClasses).toContain("border-e-border-subtle");
        // A solid 2px ring for keyboard focus (WCAG 1.4.11, 2.4.13), not a faint 1px one.
        expect(tableCellClasses).toContain(
            "focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus-indicator"
        );
        expect(tableCellClasses).not.toContain("ring-focus-indicator/");
        expect(tableCellClasses).not.toContain("ring-primary");
    });
});
