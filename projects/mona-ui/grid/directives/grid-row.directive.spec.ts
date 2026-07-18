import { TestBed } from "@angular/core/testing";
import { GridService } from "../services/grid.service";
import { gridListTableRowVariants } from "../styles/grid.mona.styles";
import { GridRowDirective } from "./grid-row.directive";

describe("GridRowDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [GridService]
        });
        const directive = TestBed.runInInjectionContext(() => new GridRowDirective());
        expect(directive).toBeTruthy();
    });

    it("uses neutral hover and persistent selection instead of primary fills", () => {
        const restingClasses = gridListTableRowVariants({ selected: false });
        const selectedClasses = gridListTableRowVariants({ selected: true });

        expect(restingClasses).toContain("bg-surface");
        expect(restingClasses).toContain("hover:bg-hover");
        expect(selectedClasses).toContain("bg-active");
        expect(selectedClasses).toContain("text-foreground");
        expect(selectedClasses).not.toContain("bg-primary");
    });
});
