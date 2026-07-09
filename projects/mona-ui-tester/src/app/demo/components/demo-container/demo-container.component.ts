import { Directionality } from "@angular/cdk/bidi";
import { Component, computed, DOCUMENT, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideCode } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { type ThemeId, ThemeService, ThemeStyle, type ThemeVariant } from "@nanahoshi/mona-ui/theme";
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
        ColorPickerComponent,
        LucideCode
    ],
    templateUrl: "./demo-container.component.html",
    styles: [
        `
            .demo-code-panel-enter {
                animation: demo-code-panel-in 300ms ease-out;
            }

            .demo-code-panel-leave {
                animation: demo-code-panel-out 300ms ease-in;
            }

            @keyframes demo-code-panel-in {
                from {
                    grid-template-rows: 0fr;
                }

                to {
                    grid-template-rows: 1fr;
                }
            }

            @keyframes demo-code-panel-out {
                from {
                    grid-template-rows: 1fr;
                }

                to {
                    grid-template-rows: 0fr;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .demo-code-panel-enter,
                .demo-code-panel-leave {
                    animation-duration: 1ms;
                }
            }
        `
    ]
})
export class DemoContainerComponent<TComponent> {
    readonly #directionality = inject(Directionality);
    readonly #document = inject(DOCUMENT);
    readonly #themeService = inject(ThemeService);
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
