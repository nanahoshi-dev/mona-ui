import { Component, signal } from "@angular/core";
import { TileViewComponent } from "@nanahoshi/mona-ui/tile-view";

@Component({
    selector: "app-tile-view-basic-example",
    imports: [TileViewComponent],
    templateUrl: "./basic-example.component.html"
})
export class TileViewBasicExampleComponent {
    protected readonly fruits = [
        "Apple",
        "Banana",
        "Cherry",
        "Date",
        "Elderberry",
        "Fig",
        "Grape",
        "Kiwi",
        "Lemon",
        "Mango",
        "Nectarine",
        "Orange"
    ];
    protected readonly selected = signal<readonly unknown[]>(["Cherry"]);
}
