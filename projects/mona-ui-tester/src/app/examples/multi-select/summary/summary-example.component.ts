import { Component, signal } from "@angular/core";
import { LabelDirective } from "@nanahoshi/mona-ui/label";
import {
    MultiSelectComponent,
    MultiSelectSummaryTagDirective,
    MultiSelectSummaryTagTemplateDirective
} from "@nanahoshi/mona-ui/multi-select";

interface Person {
    id: number;
    name: string;
}

const PEOPLE: Person[] = [
    { id: 1, name: "Ada Lovelace" },
    { id: 2, name: "Grace Hopper" },
    { id: 3, name: "Alan Turing" },
    { id: 4, name: "Katherine Johnson" },
    { id: 5, name: "Edsger Dijkstra" }
];

@Component({
    selector: "app-multi-select-summary-example",
    imports: [
        LabelDirective,
        MultiSelectComponent,
        MultiSelectSummaryTagDirective,
        MultiSelectSummaryTagTemplateDirective
    ],
    templateUrl: "./summary-example.component.html"
})
export class MultiSelectSummaryExampleComponent {
    protected readonly people = PEOPLE;
    protected readonly reviewers = signal<Person[]>(PEOPLE.slice(0, 4));
}
