import { animate, style, transition, trigger } from "@angular/animations";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    linkedSignal,
    output,
    signal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Code, LucideAngularModule } from "lucide-angular";
import {
    ButtonDirective,
    ColorPickerComponent,
    DropdownListComponent,
    DropDownListValueTemplateDirective,
    ThemeService,
    ThemeStyle
} from "mona-ui";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { ComponentConfig } from "../../utils/componentConfig";
import { CodeViewerComponent } from "../code-viewer/code-viewer.component";
import { ConfigComponent } from "../config/config.component";

@Component({
    selector: "app-demo-container",
    imports: [
        ConfigComponent,
        DropdownListComponent,
        FormsModule,
        DropDownListValueTemplateDirective,
        CodeViewerComponent,
        ButtonDirective,
        LucideAngularModule,
        ColorPickerComponent
    ],
    templateUrl: "./demo-container.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger("slideDown", [
            transition(":enter", [style({ height: "0" }), animate("300ms ease-out", style({ height: "*" }))]),
            transition(":leave", [animate("300ms ease-in", style({ height: "0" }))])
        ])
    ]
})
export class DemoContainerComponent<TComponent> {
    // readonly #defaultColors = signal<{ mona: string; shadcn: string }>({ mona: "var(--color-demo-background)", shadcn: "var(--color-demo-background)" });
    readonly #themeService = inject(ThemeService);
    protected readonly Code = Code;
    protected readonly background = computed(() => {
        const customColor = this.customColor();
        if (customColor) {
            return customColor;
        }
        return `var(--color-demo-background)`;
    });
    protected readonly codeVisible = signal(false);
    protected readonly customColor = signal<string | null>(null);
    protected readonly selectedTheme = computed(() => this.#themeService.theme());
    protected readonly themeDropdownData = signal<ThemeStyle[]>(["mona", "shadcn"]);
    public readonly config = input.required<ComponentConfig<TComponent>>();
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly subComponentMetadata = input<Record<string, ComponentMetadata>>();
    public readonly valueChange = output<Record<string, unknown>>();

    public onCodeToggle(): void {
        this.codeVisible.update(visible => !visible);
    }

    public onThemeChange(theme: ThemeStyle): void {
        this.#themeService.setTheme(theme);
    }
}
