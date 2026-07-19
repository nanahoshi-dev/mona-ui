import { Component, computed, DOCUMENT, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { DialogComponent } from "@nanahoshi/mona-ui/dialog";
import { MenuComponent, MenuItemComponent, MenuSeparatorComponent, MenubarComponent } from "@nanahoshi/mona-ui/menubar";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { WindowComponent, WindowContentTemplateDirective } from "@nanahoshi/mona-ui/window";

@Component({
    selector: "app-luna-theme-doc",
    imports: [
        ButtonDirective,
        CalendarComponent,
        CheckBoxComponent,
        DialogComponent,
        MenuComponent,
        MenuItemComponent,
        MenuSeparatorComponent,
        MenubarComponent,
        SliderComponent,
        TabComponent,
        TabContentTemplateDirective,
        TabsComponent,
        TextBoxComponent,
        WindowComponent,
        WindowContentTemplateDirective
    ],
    templateUrl: "./luna-theme-doc.component.html",
    styleUrl: "./luna-theme-doc.component.css",
    host: { class: "block" }
})
export class LunaThemeDocComponent {
    readonly #themeService = inject(ThemeService);
    readonly #document = inject(DOCUMENT);

    protected readonly calendarValue = signal<Date | Date[] | null>(new Date(2026, 6, 19));
    protected readonly dialogVisible = signal(false);
    protected readonly sliderValue = signal(64);
    protected readonly themeLabel = computed(
        () => `${this.#themeService.themeName()} ${this.#themeService.themeVariant()}`
    );
    protected readonly windowVisible = signal(false);
    protected transparencyMode(): string {
        return this.#document.documentElement?.getAttribute("data-mona-transparency") ?? "reduced";
    }
}
