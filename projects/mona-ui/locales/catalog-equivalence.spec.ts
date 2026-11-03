import type { MonaLocale, MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
import {
    compileMonaLocale,
    MONA_MESSAGE_PARAMETERS,
    type MonaLocaleDataMessages,
    type MonaMessageParameter
} from "@nanahoshi/mona-ui/i18n/icu";
import { describe, expect, it } from "vitest";
import EN_US_SOURCE from "../i18n/catalogs/en-US.messages.json";
import { AUTO_COMPLETE_DEFAULT_MESSAGES } from "../auto-complete/i18n/auto-complete.default-messages";
import { BREADCRUMB_DEFAULT_MESSAGES } from "../breadcrumb/i18n/breadcrumb.default-messages";
import { BUTTON_GROUP_DEFAULT_MESSAGES } from "../button-group/i18n/button-group.default-messages";
import { CALENDAR_DEFAULT_MESSAGES } from "../calendar/i18n/calendar.default-messages";
import { CARD_DEFAULT_MESSAGES } from "../card/i18n/card.default-messages";
import { CHART_DEFAULT_MESSAGES } from "../chart/i18n/chart.default-messages";
import { CHIP_DEFAULT_MESSAGES } from "../chip/i18n/chip.default-messages";
import { COLOR_GRADIENT_DEFAULT_MESSAGES } from "../color-gradient/i18n/color-gradient.default-messages";
import { COLOR_PALETTE_DEFAULT_MESSAGES } from "../color-palette/i18n/color-palette.default-messages";
import { COLOR_PICKER_DEFAULT_MESSAGES } from "../color-picker/i18n/color-picker.default-messages";
import { COMBO_BOX_DEFAULT_MESSAGES } from "../combo-box/i18n/combo-box.default-messages";
import { DATE_PICKER_DEFAULT_MESSAGES } from "../date-picker/i18n/date-picker.default-messages";
import { DATETIME_PICKER_DEFAULT_MESSAGES } from "../datetime-picker/i18n/datetime-picker.default-messages";
import { DIALOG_DEFAULT_MESSAGES } from "../dialog/i18n/dialog.default-messages";
import { DROPDOWN_LIST_DEFAULT_MESSAGES } from "../dropdown-list/i18n/dropdown-list.default-messages";
import { DROPDOWNS_DEFAULT_MESSAGES } from "../dropdowns/i18n/dropdowns.default-messages";
import { EDITOR_DEFAULT_MESSAGES } from "../editor/i18n/editor.default-messages";
import { FILTER_DEFAULT_MESSAGES } from "../filter/i18n/filter.default-messages";
import { GRID_DEFAULT_MESSAGES } from "../grid/i18n/grid.default-messages";
import { LIST_BOX_DEFAULT_MESSAGES } from "../list-box/i18n/list-box.default-messages";
import { LIST_DEFAULT_MESSAGES } from "../internal/list/i18n/list.default-messages";
import { MULTI_SELECT_DEFAULT_MESSAGES } from "../multi-select/i18n/multi-select.default-messages";
import { NOTIFICATION_DEFAULT_MESSAGES } from "../notification/i18n/notification.default-messages";
import { NUMERIC_TEXT_BOX_DEFAULT_MESSAGES } from "../numeric-text-box/i18n/numeric-text-box.default-messages";
import { OTP_INPUT_DEFAULT_MESSAGES } from "../otp-input/i18n/otp-input.default-messages";
import { PAGER_DEFAULT_MESSAGES } from "../pager/i18n/pager.default-messages";
import { RATING_DEFAULT_MESSAGES } from "../rating/i18n/rating.default-messages";
import { SCROLL_VIEW_DEFAULT_MESSAGES } from "../scroll-view/i18n/scroll-view.default-messages";
import { SHEET_DEFAULT_MESSAGES } from "../sheet/i18n/sheet.default-messages";
import { SLIDER_DEFAULT_MESSAGES } from "../slider/i18n/slider.default-messages";
import { SPINNER_DEFAULT_MESSAGES } from "../spinner/i18n/spinner.default-messages";
import { SPLIT_BUTTON_DEFAULT_MESSAGES } from "../split-button/i18n/split-button.default-messages";
import { SPLITTER_DEFAULT_MESSAGES } from "../splitter/i18n/splitter.default-messages";
import { STEPPER_DEFAULT_MESSAGES } from "../stepper/i18n/stepper.default-messages";
import { TABS_DEFAULT_MESSAGES } from "../tabs/i18n/tabs.default-messages";
import { TEXT_BOX_DEFAULT_MESSAGES } from "../text-box/i18n/text-box.default-messages";
import { TIME_PICKER_DEFAULT_MESSAGES } from "../time-picker/i18n/time-picker.default-messages";
import { TIME_SELECTOR_DEFAULT_MESSAGES } from "../time-selector/i18n/time-selector.default-messages";
import { TREE_DEFAULT_MESSAGES } from "../internal/tree/i18n/tree.default-messages";
import { WINDOW_DEFAULT_MESSAGES } from "../window/i18n/window.default-messages";
import AR_SA_SOURCE from "./ar-sa/ar-sa.messages.json";
import { MONA_AR_SA_LOCALE } from "./ar-sa/ar-sa.locale";
import DE_DE_SOURCE from "./de-de/de-de.messages.json";
import { MONA_DE_DE_LOCALE } from "./de-de/de-de.locale";
import ES_ES_SOURCE from "./es-es/es-es.messages.json";
import { MONA_ES_ES_LOCALE } from "./es-es/es-es.locale";
import FR_FR_SOURCE from "./fr-fr/fr-fr.messages.json";
import { MONA_FR_FR_LOCALE } from "./fr-fr/fr-fr.locale";
import ID_ID_SOURCE from "./id-id/id-id.messages.json";
import { MONA_ID_ID_LOCALE } from "./id-id/id-id.locale";
import IT_IT_SOURCE from "./it-it/it-it.messages.json";
import { MONA_IT_IT_LOCALE } from "./it-it/it-it.locale";
import JA_JP_SOURCE from "./ja-jp/ja-jp.messages.json";
import { MONA_JA_JP_LOCALE } from "./ja-jp/ja-jp.locale";
import KO_KR_SOURCE from "./ko-kr/ko-kr.messages.json";
import { MONA_KO_KR_LOCALE } from "./ko-kr/ko-kr.locale";
import PT_BR_SOURCE from "./pt-br/pt-br.messages.json";
import { MONA_PT_BR_LOCALE } from "./pt-br/pt-br.locale";
import RU_RU_SOURCE from "./ru-ru/ru-ru.messages.json";
import { MONA_RU_RU_LOCALE } from "./ru-ru/ru-ru.locale";
import TR_TR_SOURCE from "./tr-tr/tr-tr.messages.json";
import { MONA_TR_TR_LOCALE } from "./tr-tr/tr-tr.locale";
import ZH_CN_SOURCE from "./zh-cn/zh-cn.messages.json";
import { MONA_ZH_CN_LOCALE } from "./zh-cn/zh-cn.locale";
import ZH_TW_SOURCE from "./zh-tw/zh-tw.messages.json";
import { MONA_ZH_TW_LOCALE } from "./zh-tw/zh-tw.locale";

/**
 * Every TypeScript catalog must say exactly what its JSON (ICU) source says: each plain message must be the same
 * string, and each message function must return what `compileMonaLocale` makes of the source, for sample inputs
 * that exercise plural rules (including ru-RU and ar-SA), number formatting, and absent or empty strings.
 */

interface CatalogCase {
    readonly catalog: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
    readonly localeId: string;
    readonly source: MonaLocaleDataMessages;
}

const NUMBER_SAMPLES: readonly number[] = [0, 1, 2, 3, 5, 11, 21, 22, 25, 101, 1000, 12345, 3.5];
const STRING_SAMPLES: readonly string[] = ["", "Apple", "undefined", "constructor", "{x} 'y' #"];

const ENGLISH_DEFAULTS = {
    autoComplete: AUTO_COMPLETE_DEFAULT_MESSAGES,
    breadcrumb: BREADCRUMB_DEFAULT_MESSAGES,
    buttonGroup: BUTTON_GROUP_DEFAULT_MESSAGES,
    calendar: CALENDAR_DEFAULT_MESSAGES,
    card: CARD_DEFAULT_MESSAGES,
    chart: CHART_DEFAULT_MESSAGES,
    chip: CHIP_DEFAULT_MESSAGES,
    colorGradient: COLOR_GRADIENT_DEFAULT_MESSAGES,
    colorPalette: COLOR_PALETTE_DEFAULT_MESSAGES,
    colorPicker: COLOR_PICKER_DEFAULT_MESSAGES,
    comboBox: COMBO_BOX_DEFAULT_MESSAGES,
    datePicker: DATE_PICKER_DEFAULT_MESSAGES,
    dateTimePicker: DATETIME_PICKER_DEFAULT_MESSAGES,
    dialog: DIALOG_DEFAULT_MESSAGES,
    dropdownList: DROPDOWN_LIST_DEFAULT_MESSAGES,
    dropdowns: DROPDOWNS_DEFAULT_MESSAGES,
    editor: EDITOR_DEFAULT_MESSAGES,
    filter: FILTER_DEFAULT_MESSAGES,
    grid: GRID_DEFAULT_MESSAGES,
    listBox: LIST_BOX_DEFAULT_MESSAGES,
    list: LIST_DEFAULT_MESSAGES,
    multiSelect: MULTI_SELECT_DEFAULT_MESSAGES,
    notification: NOTIFICATION_DEFAULT_MESSAGES,
    numericTextBox: NUMERIC_TEXT_BOX_DEFAULT_MESSAGES,
    otpInput: OTP_INPUT_DEFAULT_MESSAGES,
    pager: PAGER_DEFAULT_MESSAGES,
    rating: RATING_DEFAULT_MESSAGES,
    scrollView: SCROLL_VIEW_DEFAULT_MESSAGES,
    sheet: SHEET_DEFAULT_MESSAGES,
    slider: SLIDER_DEFAULT_MESSAGES,
    spinner: SPINNER_DEFAULT_MESSAGES,
    splitButton: SPLIT_BUTTON_DEFAULT_MESSAGES,
    splitter: SPLITTER_DEFAULT_MESSAGES,
    stepper: STEPPER_DEFAULT_MESSAGES,
    tabs: TABS_DEFAULT_MESSAGES,
    textBox: TEXT_BOX_DEFAULT_MESSAGES,
    timePicker: TIME_PICKER_DEFAULT_MESSAGES,
    timeSelector: TIME_SELECTOR_DEFAULT_MESSAGES,
    treeView: TREE_DEFAULT_MESSAGES,
    window: WINDOW_DEFAULT_MESSAGES
} satisfies MonaLocaleMessages;

const CASES: readonly CatalogCase[] = [
    { catalog: ENGLISH_DEFAULTS as unknown as CatalogCase["catalog"], localeId: "en-US", source: EN_US_SOURCE },
    ...[
        [MONA_AR_SA_LOCALE, AR_SA_SOURCE],
        [MONA_DE_DE_LOCALE, DE_DE_SOURCE],
        [MONA_ES_ES_LOCALE, ES_ES_SOURCE],
        [MONA_FR_FR_LOCALE, FR_FR_SOURCE],
        [MONA_ID_ID_LOCALE, ID_ID_SOURCE],
        [MONA_IT_IT_LOCALE, IT_IT_SOURCE],
        [MONA_JA_JP_LOCALE, JA_JP_SOURCE],
        [MONA_KO_KR_LOCALE, KO_KR_SOURCE],
        [MONA_PT_BR_LOCALE, PT_BR_SOURCE],
        [MONA_RU_RU_LOCALE, RU_RU_SOURCE],
        [MONA_TR_TR_LOCALE, TR_TR_SOURCE],
        [MONA_ZH_CN_LOCALE, ZH_CN_SOURCE],
        [MONA_ZH_TW_LOCALE, ZH_TW_SOURCE]
    ].map(([locale, source]) => ({
        catalog: (locale as MonaLocale).messages as CatalogCase["catalog"],
        localeId: (locale as MonaLocale).id,
        source: source as MonaLocaleDataMessages
    }))
];

function argumentLists(parameters: readonly MonaMessageParameter[]): unknown[][] {
    const base: unknown[] = parameters.map(p => (p.type === "number" ? 2 : "Apple"));
    const lists: unknown[][] = [];
    parameters.forEach((parameter, index) => {
        const samples: readonly unknown[] =
            parameter.type === "number"
                ? NUMBER_SAMPLES
                : parameter.optional
                  ? [...STRING_SAMPLES, undefined]
                  : STRING_SAMPLES;
        for (const sample of samples) {
            const args = [...base];
            args[index] = sample;
            lists.push(args);
        }
    });
    for (const sample of NUMBER_SAMPLES) {
        lists.push(parameters.map(p => (p.type === "number" ? sample : "Apple")));
    }
    return lists;
}

describe("locale catalog equivalence", () => {
    it.each(CASES.map(c => [c.localeId, c] as const))(
        "%s matches its JSON source",
        (_id, { catalog, localeId, source }) => {
            const compiled = compileMonaLocale({ direction: "ltr", id: localeId, messages: source }, { strict: true })
                .messages as CatalogCase["catalog"];
            const mismatches: string[] = [];

            expect(Object.keys(catalog).sort()).toEqual(Object.keys(MONA_MESSAGE_PARAMETERS).sort());
            for (const [namespace, parameters] of Object.entries(MONA_MESSAGE_PARAMETERS)) {
                expect(Object.keys(catalog[namespace]).sort(), `${localeId} ${namespace}`).toEqual(
                    Object.keys(parameters).sort()
                );
                for (const [key, messageParameters] of Object.entries(parameters)) {
                    const expected = compiled[namespace]?.[key];
                    const actual = catalog[namespace][key];
                    const where = `${localeId} ${namespace}.${key}`;
                    if (messageParameters == null) {
                        if (actual !== expected) {
                            mismatches.push(`${where}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
                        }
                        continue;
                    }
                    for (const args of argumentLists(messageParameters)) {
                        const want = (expected as (...a: unknown[]) => string)(...args);
                        const got = (actual as (...a: unknown[]) => string)(...args);
                        if (got !== want) {
                            mismatches.push(
                                `${where}(${JSON.stringify(args)}): ${JSON.stringify(got)} !== ${JSON.stringify(want)}`
                            );
                        }
                    }
                }
            }

            expect(mismatches).toEqual([]);
        }
    );
});
