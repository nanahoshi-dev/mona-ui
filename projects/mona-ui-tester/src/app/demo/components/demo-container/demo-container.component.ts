import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropDownListComponent, DropDownListValueTemplateDirective, ThemeService, ThemeStyle } from "mona-ui";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { ComponentConfig } from "../../utils/componentConfig";
import { ConfigComponent } from "../config/config.component";

@Component({
    selector: "app-demo-container",
    imports: [ConfigComponent, DropDownListComponent, FormsModule, DropDownListValueTemplateDirective],
    templateUrl: "./demo-container.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemoContainerComponent<TComponent> {
    readonly #themeService = inject(ThemeService);
    protected readonly selectedTheme = computed(() => this.#themeService.theme());
    protected readonly themeDropdownData = signal<ThemeStyle[]>(["mona", "shadcn"]);
    public readonly config = input.required<ComponentConfig<TComponent>>();
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly valueChange = output<Record<string, unknown>>();

    public onThemeChange(theme: ThemeStyle): void {
        this.#themeService.setTheme(theme);
    }
}
