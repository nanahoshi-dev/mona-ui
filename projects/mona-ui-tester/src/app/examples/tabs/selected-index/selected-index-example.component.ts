import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";

@Component({
    selector: "app-tabs-selected-index-example",
    imports: [ButtonDirective, TabComponent, TabContentTemplateDirective, TabsComponent],
    templateUrl: "./selected-index-example.component.html"
})
export class TabsSelectedIndexExampleComponent {
    protected readonly activeTab = signal(0);
}
