import { Component } from "@angular/core";
import { LucideCreditCard } from "@lucide/angular";
import { FieldsetComponent, FieldsetLegendTemplateDirective } from "@nanahoshi/mona-ui/fieldset";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-fieldset-legend-template-example",
    imports: [FieldsetComponent, FieldsetLegendTemplateDirective, LabelComponent, LucideCreditCard, TextBoxComponent],
    templateUrl: "./legend-template-example.component.html"
})
export class FieldsetLegendTemplateExampleComponent {}
