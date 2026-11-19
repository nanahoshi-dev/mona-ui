import { Component } from "@angular/core";
import { SparklineComponent } from "@nanahoshi/mona-ui/sparkline";

interface Product {
    readonly name: string;
    readonly total: number;
    readonly weeks: readonly number[];
}

function product(name: string, weeks: readonly number[]): Product {
    return { name, total: weeks.reduce((sum, units) => sum + units, 0), weeks };
}

@Component({
    selector: "app-sparkline-table-example",
    imports: [SparklineComponent],
    templateUrl: "./table-example.component.html"
})
export class SparklineTableExampleComponent {
    protected readonly products: readonly Product[] = [
        product("Desk lamp", [42, 38, 45, 51, 48, 56, 61, 58, 66, 72, 69, 78]),
        product("Notebook", [80, 76, 71, 74, 68, 65, 62, 66, 59, 55, 57, 52]),
        product("Water bottle", [20, 24, 31, 45, 62, 70, 74, 69, 51, 38, 29, 24]),
        product("Headphones", [33, 35, 34, 36, 35, 37, 36, 38, 37, 39, 38, 40])
    ];
    /** One scale for every row, so the sparklines compare. */
    protected readonly highest = Math.max(...this.products.flatMap(item => item.weeks));
}
