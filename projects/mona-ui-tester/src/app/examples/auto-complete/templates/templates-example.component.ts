import { Component, signal } from "@angular/core";
import { LucideSearch } from "@lucide/angular";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import {
    DropdownItemTemplateDirective,
    DropdownNoDataTemplateDirective,
    DropdownPrefixTemplateDirective
} from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

@Component({
    selector: "app-auto-complete-templates-example",
    imports: [
        AutoCompleteComponent,
        DropdownItemTemplateDirective,
        DropdownNoDataTemplateDirective,
        DropdownPrefixTemplateDirective,
        LabelDirective,
        LucideSearch
    ],
    templateUrl: "./templates-example.component.html"
})
export class AutoCompleteTemplatesExampleComponent {
    protected readonly language = signal<string | null>(null);
    protected readonly languages = [
        { name: "English", code: "en" },
        { name: "French", code: "fr" },
        { name: "Japanese", code: "ja" },
        { name: "Portuguese", code: "pt" },
        { name: "Spanish", code: "es" },
        { name: "Turkish", code: "tr" }
    ];
}
