import { Component, computed, input, model, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";
import {
    applyLiveValues,
    DemoEventLog,
    DemoPart,
    DemoPartValues,
    generatePartsCodeSample
} from "../../utils/demoParts";
import { CodeViewerComponent } from "../code-viewer/code-viewer.component";
import { ConfigComponent } from "../config/config.component";
import { DemoToolbarComponent } from "../demo-toolbar/demo-toolbar.component";

/**
 * A playground for a component made of several, such as a chart and its series and axes. Each part gets a tab of its
 * inputs, and the code sample nests the parts inside the first one. The page owns the values and binds them to the
 * components it projects, so this container never needs to know their types.
 */
@Component({
    selector: "app-parts-demo-container",
    imports: [
        ButtonDirective,
        CodeViewerComponent,
        ConfigComponent,
        DemoToolbarComponent,
        TabComponent,
        TabContentTemplateDirective,
        TabsComponent
    ],
    templateUrl: "./parts-demo-container.component.html",
    styleUrl: "./parts-demo-container.component.css"
})
export class PartsDemoContainerComponent {
    protected readonly codeVisible = signal(false);
    protected readonly customColor = signal<string | null>(null);
    protected readonly generatedCode = computed(() =>
        generatePartsCodeSample(this.parts(), this.values(), this.codeContent())
    );
    protected readonly panels = computed(() => {
        const values = this.values();
        return this.parts()
            .filter(part => part.panel !== false)
            .map(part => ({ part, config: applyLiveValues(part.config, values[part.id]) }));
    });
    /** Markup the code sample adds inside the root after the parts, such as an active template. */
    public readonly codeContent = input<readonly string[]>([]);
    public readonly eventLog = input<DemoEventLog | null>(null);
    /** What the Events tab says before anything was emitted. */
    public readonly eventsHint = input("Interact with the chart to see the events it emits.");
    public readonly parts = input.required<readonly DemoPart[]>();
    public readonly values = model.required<DemoPartValues>();

    protected onCodeToggle(): void {
        this.codeVisible.update(visible => !visible);
    }

    protected onValueChange(partId: string, change: Record<string, unknown>): void {
        this.values.update(values => ({ ...values, [partId]: { ...values[partId], ...change } }));
    }
}
