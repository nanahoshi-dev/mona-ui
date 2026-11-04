import { Component, inject } from "@angular/core";
import { GridService } from "../../services/grid.service";

/**
 * Renders the `<col>` sequence for a grid table from the shared layout, so that the header, body,
 * add row and footer tables always agree on column order and width.
 */
@Component({
    // A <colgroup> must be a direct child of <table>, so an element selector cannot be used here.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "colgroup[monaGridColgroup]",
    templateUrl: "./grid-colgroup.component.html"
})
export class GridColgroupComponent {
    protected readonly gridService = inject(GridService);
}
