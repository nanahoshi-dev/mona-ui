import { Component } from "@angular/core";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
import { GridCellTemplateDirective, GridColumnComponent, GridComponent } from "@nanahoshi/mona-ui/grid";

interface Order {
    customer: string;
    freight: number;
    orderDate: Date;
    orderId: number;
    shipped: boolean;
}

const currency = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" });

@Component({
    selector: "app-grid-cell-formatting-example",
    imports: [ChipComponent, GridCellTemplateDirective, GridColumnComponent, GridComponent],
    templateUrl: "./cell-formatting-example.component.html"
})
export class GridCellFormattingExampleComponent {
    protected readonly orders: Order[] = [
        {
            orderId: 10248,
            customer: "Vins et alcools Chevalier",
            freight: 32.38,
            orderDate: new Date(2026, 6, 4),
            shipped: true
        },
        {
            orderId: 10249,
            customer: "Toms Spezialitäten",
            freight: 11.61,
            orderDate: new Date(2026, 6, 5),
            shipped: true
        },
        { orderId: 10250, customer: "Hanari Carnes", freight: 65.83, orderDate: new Date(2026, 6, 8), shipped: false },
        {
            orderId: 10251,
            customer: "Victuailles en stock",
            freight: 41.34,
            orderDate: new Date(2026, 6, 8),
            shipped: true
        },
        { orderId: 10252, customer: "Suprêmes délices", freight: 51.3, orderDate: new Date(2026, 6, 9), shipped: false }
    ];

    /** Typed for the column's value. Sorting, filtering and export still use the number. */
    protected readonly formatFreight = (value: number): string => currency.format(value);
}
