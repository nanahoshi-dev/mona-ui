import { booleanAttribute, Component, input, model } from "@angular/core";
import {
    TileViewComponent,
    TileViewItemTemplateDirective,
    type TileViewSelectionMode
} from "@nanahoshi/mona-ui/tile-view";
import type { ComponentInputsAsSignal } from "../../utils/componentConfig";

interface Photo {
    readonly hue: number;
    readonly id: number;
    readonly name: string;
}

const PLACES = ["Beach", "Bridge", "Canyon", "Forest", "Harbor", "Lake", "Meadow", "Mountain", "River", "Village"];

/** The playground's tiles: two thousand made-up photos, each a colored square with a name. */
@Component({
    imports: [TileViewComponent, TileViewItemTemplateDirective],
    templateUrl: "./tile-view-demo-photos.component.html"
})
export class TileViewDemoPhotosComponent implements ComponentInputsAsSignal<TileViewComponent> {
    protected readonly photos: readonly Photo[] = Array.from({ length: 2_000 }, (_, i) => ({
        hue: (i * 37) % 360,
        id: i + 1,
        name: `${PLACES[i % PLACES.length]} ${Math.floor(i / PLACES.length) + 1}`
    }));

    public readonly gap = input(4);
    public readonly loading = input(false, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<TileViewComponent["rounded"]>>("medium");
    public readonly selectedKeys = model<readonly unknown[]>([1]);
    public readonly selectionMode = input<TileViewSelectionMode>("multiple");
    public readonly size = input<ReturnType<TileViewComponent["size"]>>("medium");
    public readonly tileHeight = input(112);
    public readonly tileWidth = input(112);
    public readonly userClass = input("");
}
