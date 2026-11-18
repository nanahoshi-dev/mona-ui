import { Component, signal } from "@angular/core";
import { DropdownTreeComponent } from "@nanahoshi/mona-ui/dropdown-tree";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { delay, type Observable, of } from "rxjs";

interface Folder {
    readonly hasFolders: boolean;
    readonly name: string;
    readonly path: string;
}

/** A stand-in for a file server: each folder's subfolders arrive after a short wait. */
const SUBFOLDERS: Readonly<Record<string, readonly string[]>> = {
    "/": ["Documents", "Photos", "Projects"],
    "/Documents": ["Invoices", "Letters"],
    "/Photos": ["2025", "2026"],
    "/Projects": ["Mona UI", "Website"],
    "/Projects/Mona UI": ["Docs", "Source"]
};

function folder(parent: string, name: string): Folder {
    const path = parent === "/" ? `/${name}` : `${parent}/${name}`;
    return { hasFolders: path in SUBFOLDERS, name, path };
}

@Component({
    selector: "app-dropdown-tree-lazy-loading-example",
    imports: [DropdownTreeComponent, FormFieldComponent],
    templateUrl: "./lazy-loading-example.component.html"
})
export class DropdownTreeLazyLoadingExampleComponent {
    protected readonly destination = signal<Folder | null>(null);
    protected readonly roots: readonly Folder[] = SUBFOLDERS["/"].map(name => folder("/", name));

    protected readonly hasFolders = (item: Folder): boolean => item.hasFolders;
    protected readonly loadFolders = (item: Folder): Observable<Folder[]> =>
        of((SUBFOLDERS[item.path] ?? []).map(name => folder(item.path, name))).pipe(delay(600));
}
