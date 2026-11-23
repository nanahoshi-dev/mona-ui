import { Component, computed, signal } from "@angular/core";
import { LucideFolder, LucidePlus } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { moveItem } from "@nanahoshi/mona-ui/sortable";
import {
    type TabCloseEvent,
    type TabReorderEvent,
    TabComponent,
    TabStripComponent,
    TabTitleTemplateDirective
} from "@nanahoshi/mona-ui/tabs";

interface Folder {
    readonly id: number;
    readonly items: number;
    readonly name: string;
}

@Component({
    selector: "app-tabs-strip-example",
    imports: [ButtonDirective, LucideFolder, LucidePlus, TabComponent, TabStripComponent, TabTitleTemplateDirective],
    templateUrl: "./strip-example.component.html"
})
export class TabsStripExampleComponent {
    #nextId = 4;
    protected readonly folders = signal<readonly Folder[]>([
        { id: 1, items: 12, name: "Documents" },
        { id: 2, items: 48, name: "Pictures" },
        { id: 3, items: 7, name: "Projects" }
    ]);
    /** The panel shows the selected folder, and the strip moves the selection when that folder's tab closes. */
    protected readonly selected = computed(() => this.folders()[this.selectedIndex()] ?? null);
    protected readonly selectedIndex = signal(0);

    protected add(): void {
        const id = this.#nextId++;
        this.folders.update(folders => [...folders, { id, items: 0, name: `New folder ${id}` }]);
        this.selectedIndex.set(this.folders().length - 1);
    }

    /** The strip only asks; removing the folder is what closes its tab. */
    protected close(event: TabCloseEvent): void {
        this.folders.update(folders => folders.filter((_, index) => index !== event.index));
    }

    protected reorder(event: TabReorderEvent): void {
        this.folders.update(folders => moveItem(folders, event.previousIndex, event.currentIndex));
    }
}
