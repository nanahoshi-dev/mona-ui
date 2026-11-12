import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SkeletonDemoComponent } from "../../../demo/components/skeleton-demo/skeleton-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-skeleton-doc",
    imports: [ApiSectionComponent, SkeletonDemoComponent, MarkdownDocComponent],
    templateUrl: "./skeleton-doc.component.html"
})
export class SkeletonDocComponent {}
