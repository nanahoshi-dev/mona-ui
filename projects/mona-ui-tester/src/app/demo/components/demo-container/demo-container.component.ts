import { animate, style, transition, trigger } from "@angular/animations";
import { Directionality } from "@angular/cdk/bidi";
import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Code, LucideAngularModule } from "lucide-angular";
import {
    ButtonDirective,
    ColorPickerComponent,
    DropdownListComponent,
    type ThemeId,
    ThemeService,
    ThemeStyle,
    type ThemeVariant
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
    readonly #directionality = inject(Directionality);
    readonly #document = inject(DOCUMENT);
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
    protected readonly direction = signal<"ltr" | "rtl">("ltr");
    protected readonly selectedTheme = computed(() => {
        return this.themeDropdownData().find(theme => theme.id === this.#themeService.themeId());
    });
    protected readonly themeDropdownData = signal<
        Array<{ text: string; theme: ThemeStyle; variant: ThemeVariant; id: ThemeId }>
    >([
        { text: "Mona Light", theme: "mona", variant: "light", id: "mona-light" },
        { text: "Mona Dark", theme: "mona", variant: "dark", id: "mona-dark" }
    ]);
    public readonly config = input.required<ComponentConfig<TComponent>>();
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly subComponentMetadata = input<Record<string, ComponentMetadata>>();
    public readonly valueChange = output<Record<string, unknown>>();

    protected onCodeToggle(): void {
        this.codeVisible.update(visible => !visible);
    }

    protected onDirectionChange(direction: "ltr" | "rtl"): void {
        this.direction.set(direction);
        this.#document.documentElement.setAttribute("dir", direction);
        this.#directionality.change.emit(direction);
    }

    protected onThemeChange(item: { text: string; theme: ThemeStyle; variant: ThemeVariant; id: ThemeId }): void {
        this.#themeService.setThemeId(item.id);
    }
}
