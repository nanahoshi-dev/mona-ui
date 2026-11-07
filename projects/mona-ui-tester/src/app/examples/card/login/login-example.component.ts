import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CardComponent,
    CardContentDirective,
    CardDescriptionDirective,
    CardFooterComponent,
    CardHeaderComponent,
    CardTitleDirective
} from "@nanahoshi/mona-ui/card";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-card-login-example",
    imports: [
        ButtonDirective,
        CardComponent,
        CardContentDirective,
        CardDescriptionDirective,
        CardFooterComponent,
        CardHeaderComponent,
        CardTitleDirective,
        LabelComponent,
        TextBoxComponent
    ],
    templateUrl: "./login-example.component.html"
})
export class CardLoginExampleComponent {
    protected readonly email = signal("");
}
