import { Component, computed, inject, model, output } from "@angular/core";
import { LucideCode } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownGroupableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { MONA_DEFAULT_LOCALE, MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import {
    MONA_AR_SA_LOCALE,
    MONA_DE_DE_LOCALE,
    MONA_ES_ES_LOCALE,
    MONA_FR_FR_LOCALE,
    MONA_ID_ID_LOCALE,
    MONA_IT_IT_LOCALE,
    MONA_JA_JP_LOCALE,
    MONA_KO_KR_LOCALE,
    MONA_PT_BR_LOCALE,
    MONA_RU_RU_LOCALE,
    MONA_TR_TR_LOCALE,
    MONA_ZH_CN_LOCALE,
    MONA_ZH_TW_LOCALE
} from "@nanahoshi/mona-ui/locales";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { THEME_OPTIONS, type ThemeOption } from "../../../theme-options";

interface LocaleOption {
    readonly label: string;
    readonly locale: MonaLocale;
}

/** The controls above a playground: show the code, and pick a background, a locale and a theme. */
@Component({
    selector: "app-demo-toolbar",
    imports: [ButtonDirective, ColorPickerComponent, DropdownListComponent, DropdownGroupableDirective, LucideCode],
    templateUrl: "./demo-toolbar.component.html",
    host: {
        class: "flex flex-wrap items-center justify-end gap-1 p-2"
    }
})
export class DemoToolbarComponent {
    readonly #i18n = inject(MonaI18nService);
    readonly #themeService = inject(ThemeService);
    protected readonly localeOptions: readonly LocaleOption[] = [
        { label: "English", locale: MONA_DEFAULT_LOCALE },
        { label: "العربية (السعودية)", locale: MONA_AR_SA_LOCALE },
        { label: "Deutsch", locale: MONA_DE_DE_LOCALE },
        { label: "Español (España)", locale: MONA_ES_ES_LOCALE },
        { label: "Français", locale: MONA_FR_FR_LOCALE },
        { label: "Bahasa Indonesia (Indonesia)", locale: MONA_ID_ID_LOCALE },
        { label: "Italiano (Italia)", locale: MONA_IT_IT_LOCALE },
        { label: "Português (Brasil)", locale: MONA_PT_BR_LOCALE },
        { label: "Русский (Россия)", locale: MONA_RU_RU_LOCALE },
        { label: "Türkçe (Türkiye)", locale: MONA_TR_TR_LOCALE },
        { label: "日本語", locale: MONA_JA_JP_LOCALE },
        { label: "한국어 (대한민국)", locale: MONA_KO_KR_LOCALE },
        { label: "简体中文", locale: MONA_ZH_CN_LOCALE },
        { label: "繁體中文", locale: MONA_ZH_TW_LOCALE }
    ];
    protected readonly selectedLocale = computed(() => {
        const id = this.#i18n.localeId();
        return this.localeOptions.find(o => o.locale.id === id) ?? this.localeOptions[0];
    });
    protected readonly selectedTheme = computed(() => {
        return this.themeDropdownData.find(
            theme =>
                theme.name === this.#themeService.themeName() && theme.variant === this.#themeService.themeVariant()
        );
    });
    protected readonly themeDropdownData = THEME_OPTIONS;
    public readonly codeToggle = output();
    public readonly customColor = model<string | null>(null);

    protected onLocaleChange(item: LocaleOption | null | undefined): void {
        if (!item) {
            return;
        }
        this.#i18n.use(item.locale);
    }

    protected onThemeChange(item: ThemeOption | null | undefined): void {
        if (!item) {
            return;
        }
        this.#themeService.setTheme(item);
    }
}
