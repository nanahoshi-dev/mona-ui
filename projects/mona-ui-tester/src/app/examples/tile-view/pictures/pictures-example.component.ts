import { Component, signal } from "@angular/core";
import {
    type TileViewItemActivateEvent,
    TileViewComponent,
    TileViewItemTemplateDirective
} from "@nanahoshi/mona-ui/tile-view";

interface Picture {
    readonly hue: number;
    readonly id: number;
    readonly name: string;
}

@Component({
    selector: "app-tile-view-pictures-example",
    imports: [TileViewComponent, TileViewItemTemplateDirective],
    templateUrl: "./pictures-example.component.html"
})
export class TileViewPicturesExampleComponent {
    protected readonly opened = signal("");
    protected readonly pictures: readonly Picture[] = Array.from({ length: 10_000 }, (_, i) => ({
        hue: (i * 47) % 360,
        id: i + 1,
        name: `Picture ${i + 1}`
    }));
    protected readonly selected = signal<readonly unknown[]>([]);

    protected open(event: TileViewItemActivateEvent<Picture>): void {
        this.opened.set(event.item.name);
    }
}
