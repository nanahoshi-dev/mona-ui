import {
    gridCellBaseThemeVariants,
    gridCellContainerThemeVariants,
    gridCellEditorBaseThemeVariants,
    gridListTableCellThemeVariants,
    gridListTableRowThemeVariants,
    gridSelectionCellThemeVariants
} from "../styles/grid.styles";

describe("grid row sizing", () => {
    it("keeps ordinary cells in flow so templates determine row height", () => {
        const host = gridCellBaseThemeVariants().split(/\s+/);
        const content = gridCellContainerThemeVariants().split(/\s+/);
        expect(host).toContain("relative");
        expect(host).toContain("min-h-9");
        expect(host).not.toContain("absolute");
        expect(content).not.toContain("overflow-hidden");
        expect(gridListTableRowThemeVariants().split(/\s+/)).not.toContain("h-9");
        expect(gridListTableCellThemeVariants().split(/\s+/)).not.toContain("h-9");
    });

    it("lets editors and structural controls contribute their intrinsic height", () => {
        expect(gridCellEditorBaseThemeVariants().split(/\s+/)).toContain("min-h-9");
        const selection = gridSelectionCellThemeVariants().split(/\s+/);
        expect(selection).toContain("min-h-9");
        expect(selection).not.toContain("absolute");
    });

    it("retains a separate clipped fixed-cell layout for virtualization", () => {
        expect(gridCellBaseThemeVariants({ virtual: true }).split(/\s+/)).toContain("absolute");
        expect(gridCellContainerThemeVariants({ virtual: true }).split(/\s+/)).toContain("overflow-hidden");
        expect(gridSelectionCellThemeVariants({ virtual: true }).split(/\s+/)).toContain("absolute");
    });
});
