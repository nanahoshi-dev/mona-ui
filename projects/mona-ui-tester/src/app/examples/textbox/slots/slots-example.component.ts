import { Component, signal } from "@angular/core";
import { LucideSearch } from "@lucide/angular";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-textbox-slots-example",
    imports: [LabelComponent, LucideSearch, TextBoxComponent, TextBoxPrefixTemplateDirective, TextBoxSuffixTemplateDirective],
    templateUrl: "./slots-example.component.html"
})
export class TextboxSlotsExampleComponent {
    protected readonly query = signal("");
    protected readonly username = signal("ada");
}
