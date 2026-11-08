import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { TabCloseEvent } from "@nanahoshi/mona-ui/tabs";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";

interface Report {
    readonly id: number;
    readonly title: string;
}

@Component({
    selector: "app-tabs-closable-example",
    imports: [ButtonDirective, TabComponent, TabContentTemplateDirective, TabsComponent],
    templateUrl: "./closable-example.component.html"
})
export class TabsClosableExampleComponent {
    #nextId = 4;
    protected readonly reports = signal<readonly Report[]>([
        { id: 1, title: "January" },
        { id: 2, title: "February" },
        { id: 3, title: "March" }
    ]);

    protected add(): void {
        const id = this.#nextId++;
        this.reports.update(reports => [...reports, { id, title: `Report ${id}` }]);
    }

    /** The tabs only ask; removing the tab from the data is what closes it. */
    protected close(event: TabCloseEvent): void {
        this.reports.update(reports => reports.filter((_, index) => index !== event.index));
    }
}
