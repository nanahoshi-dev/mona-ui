import { booleanAttribute, Component, computed, input, signal } from "@angular/core";
import { SortableDirective, SortableItemDirective, type SortableOrientation } from "@nanahoshi/mona-ui/sortable";
import type { ComponentInputsAsSignal } from "../../utils/componentConfig";

/** The playground's list: a reading list laid out as the orientation asks, as a column, a row, or wrapping rows. */
@Component({
    imports: [SortableDirective, SortableItemDirective],
    templateUrl: "./sortable-demo-list.component.html"
})
export class SortableDemoListComponent implements ComponentInputsAsSignal<SortableDirective> {
    protected readonly books = signal([
        "Dune",
        "Kindred",
        "Neuromancer",
        "The Left Hand of Darkness",
        "Piranesi",
        "Station Eleven"
    ]);
    protected readonly itemClass = computed(() =>
        this.orientation() === "vertical"
            ? "flex items-center rounded-md border border-border bg-card px-3 py-2 text-sm"
            : "flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm"
    );
    protected readonly listClass = computed(() => {
        switch (this.orientation()) {
            case "horizontal":
                return "flex max-w-full gap-2 overflow-x-auto p-1";
            case "mixed":
                return "flex w-96 max-w-full flex-wrap gap-2 p-1";
            default:
                return "flex w-72 flex-col gap-1 p-1";
        }
    });

    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly label = input("");
    public readonly lockAxis = input(false, { transform: booleanAttribute });
    public readonly orientation = input<SortableOrientation>("vertical");
}
