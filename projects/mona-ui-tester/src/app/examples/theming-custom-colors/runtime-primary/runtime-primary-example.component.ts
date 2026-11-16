import { Component, DestroyRef, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

@Component({
    selector: "app-theming-custom-colors-runtime-primary-example",
    imports: [ButtonDirective, ColorPickerComponent],
    templateUrl: "./runtime-primary-example.component.html"
})
export class ThemingCustomColorsRuntimePrimaryExampleComponent {
    readonly #theme = inject(ThemeService);

    protected readonly color = signal(this.#theme.colorPaletteSeeds()?.primary ?? null);

    public constructor() {
        // A preview: the page gets its configured colors back when the example goes away.
        inject(DestroyRef).onDestroy(() => this.#theme.clearColorPalette());
    }

    protected apply(color: string | null): void {
        this.color.set(color);
        if (color) {
            this.#theme.setPrimaryColor(color);
        } else {
            this.#theme.clearColorPalette();
        }
    }
}
