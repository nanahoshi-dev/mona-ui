import { Component, signal } from "@angular/core";
import {
    moveTreeNode,
    type NodeDropEvent,
    TreeViewComponent,
    TreeViewDragAndDropDirective,
    TreeViewExpandableDirective
} from "@nanahoshi/mona-ui/tree-view";

interface Track {
    id: string;
    items: Track[];
    text: string;
}

@Component({
    selector: "app-tree-view-drag-and-drop-example",
    imports: [TreeViewComponent, TreeViewDragAndDropDirective, TreeViewExpandableDirective],
    templateUrl: "./drag-and-drop-example.component.html"
})
export class TreeViewDragAndDropExampleComponent {
    protected readonly playlists = signal<Track[]>([
        {
            id: "focus",
            text: "Focus",
            items: [
                { id: "rain", text: "Rain on glass", items: [] },
                { id: "piano", text: "Quiet piano", items: [] }
            ]
        },
        {
            id: "workout",
            text: "Workout",
            items: [
                { id: "drums", text: "Big drums", items: [] },
                { id: "synth", text: "Fast synth", items: [] }
            ]
        }
    ]);

    /** The tree doesn't move the node itself: apply the move and pass the new array back. */
    protected onNodeDrop(event: NodeDropEvent<Track>): void {
        this.playlists.set(moveTreeNode(this.playlists(), event, "id", "items"));
    }
}
