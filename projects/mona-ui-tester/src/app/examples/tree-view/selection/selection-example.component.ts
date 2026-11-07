import { Component, signal } from "@angular/core";
import { LucideFile, LucideFolder } from "@lucide/angular";
import {
    TreeViewComponent,
    TreeViewExpandableDirective,
    TreeViewNodeTemplateDirective,
    TreeViewSelectableDirective
} from "@nanahoshi/mona-ui/tree-view";

interface FileItem {
    id: string;
    items: FileItem[];
    text: string;
}

@Component({
    selector: "app-tree-view-selection-example",
    imports: [
        LucideFile,
        LucideFolder,
        TreeViewComponent,
        TreeViewExpandableDirective,
        TreeViewNodeTemplateDirective,
        TreeViewSelectableDirective
    ],
    templateUrl: "./selection-example.component.html"
})
export class TreeViewSelectionExampleComponent {
    protected readonly files: FileItem[] = [
        {
            id: "src",
            text: "src",
            items: [
                { id: "main.ts", text: "main.ts", items: [] },
                {
                    id: "app",
                    text: "app",
                    items: [
                        { id: "app.ts", text: "app.ts", items: [] },
                        { id: "app.html", text: "app.html", items: [] }
                    ]
                }
            ]
        },
        { id: "package.json", text: "package.json", items: [] },
        { id: "README.md", text: "README.md", items: [] }
    ];
    protected readonly selectedKeys = signal<string[]>([]);
}
