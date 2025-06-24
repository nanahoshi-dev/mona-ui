import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ComponentConfig } from "../../utils/componentConfig";
import { ConfigComponent } from "../config/config.component";

@Component({
    selector: "app-demo-container",
    imports: [ConfigComponent],
    templateUrl: "./demo-container.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemoContainerComponent<TComponent> {
    public readonly config = input.required<ComponentConfig<TComponent>>();
    public readonly valueChange = output<Record<string, unknown>>();
}
