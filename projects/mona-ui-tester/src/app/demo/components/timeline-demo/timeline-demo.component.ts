import { NgComponentOutlet } from "@angular/common";
import { Component, computed } from "@angular/core";
import type { TimelineComponent } from "@nanahoshi/mona-ui/timeline";
import type { ComponentConfig } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { TimelineDemoEventsComponent } from "./timeline-demo-events.component";

const DATE_FORMAT_CHOICES: readonly { readonly text: string; readonly value: Intl.DateTimeFormatOptions }[] = [
    { text: "Medium date", value: { dateStyle: "medium" } },
    { text: "Long date", value: { dateStyle: "long" } },
    { text: "Weekday and day", value: { day: "numeric", month: "short", weekday: "short" } },
    { text: "Date and time", value: { dateStyle: "medium", timeStyle: "short" } }
];

@Component({
    selector: "app-timeline-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./timeline-demo.component.html"
})
export class TimelineDemoComponent extends AbstractDemoComponent<TimelineComponent> {
    protected readonly config = computed<ComponentConfig<TimelineComponent>>(() => ({
        inputs: deriveInputConfig<TimelineComponent>(this.metadata(), {
            // The events are fixed, so their names, fields and keys are too.
            ariaLabel: undefined,
            ariaLabelledBy: undefined,
            dateField: undefined,
            dateFormat: {
                type: "customDropdown",
                value: DATE_FORMAT_CHOICES,
                textField: "text",
                valueField: "value",
                defaultValue: DATE_FORMAT_CHOICES[0].value
            },
            descriptionField: undefined,
            expandedKeys: undefined,
            // The playground sits under the page's title, a level 1 heading.
            headingLevel: {
                type: "number",
                min: 1,
                max: 6,
                nullable: true,
                value: 2
            },
            keyField: undefined,
            orientation: {
                type: "dropdown",
                value: ["vertical", "horizontal"],
                defaultValue: "vertical"
            },
            subtitleField: undefined,
            titleField: undefined,
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("TimelineComponent");
    protected readonly wrapperComponent = TimelineDemoEventsComponent;
}
