import { Component, signal } from "@angular/core";
import { LucideChevronDown, LucideSettings } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ExpansionPanelActionsTemplateDirective,
    ExpansionPanelComponent,
    ExpansionPanelIconTemplateDirective
} from "@nanahoshi/mona-ui/expansion-panel";

@Component({
    selector: "app-expansion-panel-header-templates-example",
    imports: [
        ButtonDirective,
        ExpansionPanelActionsTemplateDirective,
        ExpansionPanelComponent,
        ExpansionPanelIconTemplateDirective,
        LucideChevronDown,
        LucideSettings
    ],
    templateUrl: "./header-templates-example.component.html"
})
export class ExpansionPanelHeaderTemplatesExampleComponent {
    protected readonly settingsClicks = signal(0);
}
