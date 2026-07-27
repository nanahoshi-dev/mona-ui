import { Component } from "@angular/core";
import { SkeletonDemoComponent } from "../../../demo/components/skeleton-demo/skeleton-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-skeleton-doc",
    imports: [SkeletonDemoComponent, MarkdownDocComponent],
    templateUrl: "./skeleton-doc.component.html"
})
export class SkeletonDocComponent {}
