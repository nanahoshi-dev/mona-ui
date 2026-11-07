import { Component, signal } from "@angular/core";
import { type SchemaPathTree, validate } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    GridAddCommandDirective,
    GridColumnComponent,
    GridCommandColumnComponent,
    GridComponent,
    GridEditableDirective,
    type GridEditFormContext,
    type GridEditSchemaFactory,
    type GridRemoveEvent,
    type GridSaveEvent,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";

/** A grid row: typed fields, plus the open shape the grid passes rows around in. */
interface Product extends Record<PropertyKey, unknown> {
    id: number;
    inStock: boolean;
    name: string;
    price: number;
}

/**
 * Validates the row being edited. A failed save keeps the editor open and announces the error. The grid hands rows over
 * untyped, so the typed schema is cast where it's passed in.
 */
const productSchema =
    (_context: GridEditFormContext) =>
    (row: SchemaPathTree<Product>): void => {
        validate(row.name, ({ value }) =>
            value().trim() !== "" ? undefined : { kind: "required", message: "Enter a name." }
        );
        validate(row.price, ({ value }) =>
            value() >= 0 ? undefined : { kind: "min", message: "The price can't be negative." }
        );
    };

@Component({
    selector: "app-grid-editing-example",
    imports: [
        ButtonDirective,
        GridAddCommandDirective,
        GridColumnComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridEditableDirective,
        GridToolbarTemplateDirective
    ],
    templateUrl: "./editing-example.component.html"
})
export class GridEditingExampleComponent {
    #nextId = 4;
    protected readonly productSchema = productSchema as GridEditSchemaFactory;
    protected readonly products = signal<Product[]>([
        { id: 1, name: "Desk lamp", price: 39, inStock: true },
        { id: 2, name: "Notebook", price: 6.5, inStock: true },
        { id: 3, name: "Standing desk", price: 420, inStock: false }
    ]);
    protected readonly createProduct = (): Record<PropertyKey, unknown> => ({
        id: this.#nextId++,
        name: "",
        price: 0,
        inStock: true
    });

    protected onRemove(event: GridRemoveEvent): void {
        this.products.update(products => products.filter(product => product.id !== event.key));
    }

    /** The grid never changes `data` itself: write the saved row back. */
    protected onSave(event: GridSaveEvent): void {
        const saved = event.rowData as Product;
        const id = event.originalRowData?.["id"];
        if (event.operation === "create") {
            this.products.update(products => [...products, saved]);
        } else {
            this.products.update(products => products.map(product => (product.id === id ? saved : product)));
        }
    }
}
