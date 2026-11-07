import { Component } from "@angular/core";
import { AccordionComponent, ExpansionPanelComponent } from "@nanahoshi/mona-ui/expansion-panel";

@Component({
    selector: "app-expansion-panel-accordion-example",
    imports: [AccordionComponent, ExpansionPanelComponent],
    templateUrl: "./accordion-example.component.html"
})
export class ExpansionPanelAccordionExampleComponent {
    protected readonly questions = [
        { answer: "Orders ship within two working days.", title: "When will my order ship?" },
        { answer: "You can return an item within 30 days of delivery.", title: "Can I return an item?" },
        { answer: "We accept cards and bank transfers.", title: "How can I pay?" }
    ];
}
