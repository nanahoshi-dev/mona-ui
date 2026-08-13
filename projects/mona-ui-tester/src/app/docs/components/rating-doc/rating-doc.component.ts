import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RatingDemoComponent } from "../../../demo/components/rating-demo/rating-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-rating-doc",
    imports: [RatingDemoComponent, MarkdownDocComponent],
    templateUrl: "./rating-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingDocComponent {}
