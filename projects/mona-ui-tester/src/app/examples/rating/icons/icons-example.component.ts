import { Component, signal } from "@angular/core";
import { LucideThumbsUp } from "@lucide/angular";
import {
    RatingComponent,
    RatingHoveredItemTemplateDirective,
    RatingItemTemplateDirective,
    RatingSelectedItemTemplateDirective
} from "@nanahoshi/mona-ui/rating";

@Component({
    selector: "app-rating-icons-example",
    imports: [
        LucideThumbsUp,
        RatingComponent,
        RatingHoveredItemTemplateDirective,
        RatingItemTemplateDirective,
        RatingSelectedItemTemplateDirective
    ],
    templateUrl: "./icons-example.component.html"
})
export class RatingIconsExampleComponent {
    protected readonly favorite = signal(4);
    protected readonly helpful = signal(2);
}
