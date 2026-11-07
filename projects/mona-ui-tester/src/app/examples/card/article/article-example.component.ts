import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CardActionDirective,
    CardComponent,
    CardContentDirective,
    CardDescriptionDirective,
    CardFooterComponent,
    CardHeaderComponent,
    CardTitleDirective
} from "@nanahoshi/mona-ui/card";

@Component({
    selector: "app-card-article-example",
    imports: [
        ButtonDirective,
        CardActionDirective,
        CardComponent,
        CardContentDirective,
        CardDescriptionDirective,
        CardFooterComponent,
        CardHeaderComponent,
        CardTitleDirective
    ],
    templateUrl: "./article-example.component.html"
})
export class CardArticleExampleComponent {}
