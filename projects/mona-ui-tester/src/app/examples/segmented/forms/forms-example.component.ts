import { Component, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SegmentedComponent, type SegmentedOption } from "@nanahoshi/mona-ui/segmented";

type Period = "day" | "month" | "week";

interface ReportModel {
    period: Period | null;
}

@Component({
    selector: "app-segmented-forms-example",
    imports: [FormField, LabelComponent, SegmentedComponent],
    templateUrl: "./forms-example.component.html"
})
export class SegmentedFormsExampleComponent {
    readonly #model = signal<ReportModel>({ period: "week" });
    protected readonly periods: readonly SegmentedOption<Period>[] = [
        { label: "Day", value: "day" },
        { label: "Week", value: "week" },
        { label: "Month", value: "month" }
    ];
    protected readonly report = form(this.#model);
}
