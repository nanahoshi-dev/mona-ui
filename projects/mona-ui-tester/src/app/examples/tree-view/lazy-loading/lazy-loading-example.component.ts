import { Component } from "@angular/core";
import { TreeViewComponent, TreeViewExpandableDirective } from "@nanahoshi/mona-ui/tree-view";
import { delay, type Observable, of } from "rxjs";

interface Folder {
    hasChildren: boolean;
    id: string;
    text: string;
}

/** Stands in for a server: it returns a folder's contents after a short wait. */
const fetchChildren = (folder: Folder): Observable<Folder[]> =>
    of(
        folder.id.split("/").length < 3
            ? ["Drafts", "Final"].map(name => ({ id: `${folder.id}/${name}`, text: name, hasChildren: true }))
            : [{ id: `${folder.id}/notes.txt`, text: "notes.txt", hasChildren: false }]
    ).pipe(delay(800));

@Component({
    selector: "app-tree-view-lazy-loading-example",
    imports: [TreeViewComponent, TreeViewExpandableDirective],
    templateUrl: "./lazy-loading-example.component.html"
})
export class TreeViewLazyLoadingExampleComponent {
    protected readonly folders: Folder[] = [
        { id: "Documents", text: "Documents", hasChildren: true },
        { id: "Pictures", text: "Pictures", hasChildren: true }
    ];
    protected readonly loadChildren = fetchChildren;
    protected readonly hasChildren = (folder: Folder): boolean => folder.hasChildren;
}
