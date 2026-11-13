import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { RatingDemoComponent } from "../../../demo/components/rating-demo/rating-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-rating-doc",
    imports: [ApiSectionComponent, RatingDemoComponent, MarkdownDocComponent],
    templateUrl: "./rating-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingDocComponent {}
