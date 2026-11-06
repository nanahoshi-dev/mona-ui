import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { type IcuElement, parseIcuMessage } from "../projects/mona-ui/i18n/icu/parser/icu-message-parser";
import {
    type MessageParameterInfo,
    type MessageParameterTable,
    readMessageParameterTable
} from "./generate-message-parameters";

/*
 * The JSON (ICU MessageFormat) files are the source of every catalog. This script turns them into TypeScript:
 * one `<folder>.messages.ts` per official locale, and one `*.default-messages.ts` per component from the English
 * catalog. The generated code calls `formatNumber` and `Intl.PluralRules` directly, so no parser runs at runtime.
 */

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const LIBRARY_DIR = path.resolve(scriptDir, "../projects/mona-ui");
export const ENGLISH_SOURCE_FILE = path.join(LIBRARY_DIR, "i18n/catalogs/en-US.messages.json");
export const LOCALES_DIR = path.join(LIBRARY_DIR, "locales");

/** Whitespace that ESLint's no-irregular-whitespace rejects in source code. */
const IRREGULAR_WHITESPACE_REGEX = new RegExp(
    `[${[
        0x0b, 0x0c, 0x85, 0xa0, 0x1680, 0x180e, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008,
        0x2009, 0x200a, 0x200b, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff
    ]
        .map(code => String.fromCharCode(code))
        .join("")}]`,
    "g"
);

/** Where each namespace of the English catalog is generated. */
export interface DefaultCatalogTarget {
    readonly constName: string;
    /** Relative to the library directory. */
    readonly file: string;
    readonly namespace: string;
    /** `type` annotates the constant (`: T`); `satisfies` keeps the inferred type (`satisfies T`). */
    readonly style: "satisfies" | "type";
    readonly typeName: string;
}

export const DEFAULT_CATALOG_TARGETS: readonly DefaultCatalogTarget[] = [
    {
        constName: "AUTO_COMPLETE_DEFAULT_MESSAGES",
        file: "auto-complete/i18n/auto-complete.default-messages.ts",
        namespace: "autoComplete",
        style: "type",
        typeName: "MonaAutoCompleteMessages"
    },
    {
        constName: "BREADCRUMB_DEFAULT_MESSAGES",
        file: "breadcrumb/i18n/breadcrumb.default-messages.ts",
        namespace: "breadcrumb",
        style: "type",
        typeName: "MonaBreadcrumbMessages"
    },
    {
        constName: "BUTTON_GROUP_DEFAULT_MESSAGES",
        file: "button-group/i18n/button-group.default-messages.ts",
        namespace: "buttonGroup",
        style: "satisfies",
        typeName: "MonaButtonGroupMessages"
    },
    {
        constName: "CALENDAR_DEFAULT_MESSAGES",
        file: "calendar/i18n/calendar.default-messages.ts",
        namespace: "calendar",
        style: "type",
        typeName: "MonaCalendarMessages"
    },
    {
        constName: "CARD_DEFAULT_MESSAGES",
        file: "card/i18n/card.default-messages.ts",
        namespace: "card",
        style: "satisfies",
        typeName: "MonaCardMessages"
    },
    {
        constName: "CHART_DEFAULT_MESSAGES",
        file: "chart/i18n/chart.default-messages.ts",
        namespace: "chart",
        style: "type",
        typeName: "MonaChartMessages"
    },
    {
        constName: "CHIP_DEFAULT_MESSAGES",
        file: "chip/i18n/chip.default-messages.ts",
        namespace: "chip",
        style: "satisfies",
        typeName: "MonaChipMessages"
    },
    {
        constName: "COLOR_GRADIENT_DEFAULT_MESSAGES",
        file: "color-gradient/i18n/color-gradient.default-messages.ts",
        namespace: "colorGradient",
        style: "type",
        typeName: "MonaColorGradientMessages"
    },
    {
        constName: "LABEL_DEFAULT_MESSAGES",
        file: "label/i18n/label.default-messages.ts",
        namespace: "label",
        style: "type",
        typeName: "MonaLabelMessages"
    },
    {
        constName: "COLOR_PALETTE_DEFAULT_MESSAGES",
        file: "color-palette/i18n/color-palette.default-messages.ts",
        namespace: "colorPalette",
        style: "type",
        typeName: "MonaColorPaletteMessages"
    },
    {
        constName: "COLOR_PICKER_DEFAULT_MESSAGES",
        file: "color-picker/i18n/color-picker.default-messages.ts",
        namespace: "colorPicker",
        style: "type",
        typeName: "MonaColorPickerMessages"
    },
    {
        constName: "COMBO_BOX_DEFAULT_MESSAGES",
        file: "combo-box/i18n/combo-box.default-messages.ts",
        namespace: "comboBox",
        style: "type",
        typeName: "MonaComboBoxMessages"
    },
    {
        constName: "DATE_PICKER_DEFAULT_MESSAGES",
        file: "date-picker/i18n/date-picker.default-messages.ts",
        namespace: "datePicker",
        style: "type",
        typeName: "MonaDatePickerMessages"
    },
    {
        constName: "DATETIME_PICKER_DEFAULT_MESSAGES",
        file: "datetime-picker/i18n/datetime-picker.default-messages.ts",
        namespace: "dateTimePicker",
        style: "type",
        typeName: "MonaDateTimePickerMessages"
    },
    {
        constName: "DIALOG_DEFAULT_MESSAGES",
        file: "dialog/i18n/dialog.default-messages.ts",
        namespace: "dialog",
        style: "type",
        typeName: "MonaDialogMessages"
    },
    {
        constName: "DROPDOWN_LIST_DEFAULT_MESSAGES",
        file: "dropdown-list/i18n/dropdown-list.default-messages.ts",
        namespace: "dropdownList",
        style: "type",
        typeName: "MonaDropdownListMessages"
    },
    {
        constName: "DROPDOWNS_DEFAULT_MESSAGES",
        file: "dropdowns/i18n/dropdowns.default-messages.ts",
        namespace: "dropdowns",
        style: "type",
        typeName: "MonaDropdownsMessages"
    },
    {
        constName: "EDITOR_DEFAULT_MESSAGES",
        file: "editor/i18n/editor.default-messages.ts",
        namespace: "editor",
        style: "type",
        typeName: "MonaEditorMessages"
    },
    {
        constName: "FILTER_DEFAULT_MESSAGES",
        file: "filter/i18n/filter.default-messages.ts",
        namespace: "filter",
        style: "type",
        typeName: "MonaFilterMessages"
    },
    {
        constName: "GRID_DEFAULT_MESSAGES",
        file: "grid/i18n/grid.default-messages.ts",
        namespace: "grid",
        style: "satisfies",
        typeName: "MonaGridMessages"
    },
    {
        constName: "LIST_BOX_DEFAULT_MESSAGES",
        file: "list-box/i18n/list-box.default-messages.ts",
        namespace: "listBox",
        style: "type",
        typeName: "MonaListBoxMessages"
    },
    {
        constName: "LIST_DEFAULT_MESSAGES",
        file: "internal/list/i18n/list.default-messages.ts",
        namespace: "list",
        style: "type",
        typeName: "MonaListMessages"
    },
    {
        constName: "MULTI_SELECT_DEFAULT_MESSAGES",
        file: "multi-select/i18n/multi-select.default-messages.ts",
        namespace: "multiSelect",
        style: "type",
        typeName: "MonaMultiSelectMessages"
    },
    {
        constName: "NOTIFICATION_DEFAULT_MESSAGES",
        file: "notification/i18n/notification.default-messages.ts",
        namespace: "notification",
        style: "satisfies",
        typeName: "MonaNotificationMessages"
    },
    {
        constName: "NUMERIC_TEXT_BOX_DEFAULT_MESSAGES",
        file: "numeric-text-box/i18n/numeric-text-box.default-messages.ts",
        namespace: "numericTextBox",
        style: "type",
        typeName: "MonaNumericTextBoxMessages"
    },
    {
        constName: "OTP_INPUT_DEFAULT_MESSAGES",
        file: "otp-input/i18n/otp-input.default-messages.ts",
        namespace: "otpInput",
        style: "type",
        typeName: "MonaOtpInputMessages"
    },
    {
        constName: "PAGER_DEFAULT_MESSAGES",
        file: "pager/i18n/pager.default-messages.ts",
        namespace: "pager",
        style: "satisfies",
        typeName: "MonaPagerMessages"
    },
    {
        constName: "PROGRESS_BAR_DEFAULT_MESSAGES",
        file: "progress-bar/i18n/progress-bar.default-messages.ts",
        namespace: "progressBar",
        style: "type",
        typeName: "MonaProgressBarMessages"
    },
    {
        constName: "RATING_DEFAULT_MESSAGES",
        file: "rating/i18n/rating.default-messages.ts",
        namespace: "rating",
        style: "type",
        typeName: "MonaRatingMessages"
    },
    {
        constName: "SCROLL_VIEW_DEFAULT_MESSAGES",
        file: "scroll-view/i18n/scroll-view.default-messages.ts",
        namespace: "scrollView",
        style: "type",
        typeName: "MonaScrollViewMessages"
    },
    {
        constName: "SHEET_DEFAULT_MESSAGES",
        file: "sheet/i18n/sheet.default-messages.ts",
        namespace: "sheet",
        style: "type",
        typeName: "MonaSheetMessages"
    },
    {
        constName: "SLIDER_DEFAULT_MESSAGES",
        file: "slider/i18n/slider.default-messages.ts",
        namespace: "slider",
        style: "type",
        typeName: "MonaSliderMessages"
    },
    {
        constName: "SPINNER_DEFAULT_MESSAGES",
        file: "spinner/i18n/spinner.default-messages.ts",
        namespace: "spinner",
        style: "satisfies",
        typeName: "MonaSpinnerMessages"
    },
    {
        constName: "SPLIT_BUTTON_DEFAULT_MESSAGES",
        file: "split-button/i18n/split-button.default-messages.ts",
        namespace: "splitButton",
        style: "type",
        typeName: "MonaSplitButtonMessages"
    },
    {
        constName: "SPLITTER_DEFAULT_MESSAGES",
        file: "splitter/i18n/splitter.default-messages.ts",
        namespace: "splitter",
        style: "type",
        typeName: "MonaSplitterMessages"
    },
    {
        constName: "STEPPER_DEFAULT_MESSAGES",
        file: "stepper/i18n/stepper.default-messages.ts",
        namespace: "stepper",
        style: "type",
        typeName: "MonaStepperMessages"
    },
    {
        constName: "TABS_DEFAULT_MESSAGES",
        file: "tabs/i18n/tabs.default-messages.ts",
        namespace: "tabs",
        style: "type",
        typeName: "MonaTabsMessages"
    },
    {
        constName: "TEXT_BOX_DEFAULT_MESSAGES",
        file: "text-box/i18n/text-box.default-messages.ts",
        namespace: "textBox",
        style: "satisfies",
        typeName: "MonaTextBoxMessages"
    },
    {
        constName: "TIME_PICKER_DEFAULT_MESSAGES",
        file: "time-picker/i18n/time-picker.default-messages.ts",
        namespace: "timePicker",
        style: "type",
        typeName: "MonaTimePickerMessages"
    },
    {
        constName: "TIME_SELECTOR_DEFAULT_MESSAGES",
        file: "time-selector/i18n/time-selector.default-messages.ts",
        namespace: "timeSelector",
        style: "type",
        typeName: "MonaTimeSelectorMessages"
    },
    {
        constName: "TREE_DEFAULT_MESSAGES",
        file: "internal/tree/i18n/tree.default-messages.ts",
        namespace: "treeView",
        style: "type",
        typeName: "MonaTreeViewMessages"
    },
    {
        constName: "WINDOW_DEFAULT_MESSAGES",
        file: "window/i18n/window.default-messages.ts",
        namespace: "window",
        style: "type",
        typeName: "MonaWindowMessages"
    }
];

export interface GeneratedFile {
    readonly content: string;
    /** Absolute path. */
    readonly file: string;
}

type Messages = Readonly<Record<string, Readonly<Record<string, string>>>>;

export interface EmitContext {
    readonly localeId: string;
    readonly parameters: readonly MessageParameterInfo[];
    /** The TypeScript expression `#` stands for, inside a plural. */
    readonly pound: string | null;
    /** Optional parameters known to be set, inside the branch of a select that checked them. */
    readonly present: ReadonlySet<string>;
    readonly usage: EmitUsage;
}

export interface EmitUsage {
    formatNumber: boolean;
    readonly parameters: Set<string>;
    plural: boolean;
    pluralRules: Set<"cardinal" | "ordinal">;
}

/** Generates every catalog file from the JSON sources. Throws when a source has an issue. */
export async function generateLocaleCatalogs(
    table: MessageParameterTable = readMessageParameterTable()
): Promise<readonly GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    // Loaded here rather than at the top, so specs can import the emitter without the library's path aliases.
    // The validator imports @nanahoshi/mona-ui/i18n, whose Angular dependencies need the JIT compiler under Node.
    await import("@angular/compiler");
    const { validateMonaLocaleData } = await import("../projects/mona-ui/i18n/icu/compile-mona-locale");
    const readSource = (file: string, localeId: string): Messages =>
        readSourceFile(file, localeId, table, validateMonaLocaleData);

    const english = readSource(ENGLISH_SOURCE_FILE, "en-US");
    for (const target of DEFAULT_CATALOG_TARGETS) {
        files.push({
            content: await format(emitDefaultCatalog(target, english[target.namespace] ?? {}, table)),
            file: path.join(LIBRARY_DIR, target.file)
        });
    }

    for (const folder of fs.readdirSync(LOCALES_DIR).sort()) {
        const sourceFile = path.join(LOCALES_DIR, folder, `${folder}.messages.json`);
        if (!fs.existsSync(sourceFile)) {
            continue;
        }
        const localeId = new Intl.Locale(folder.replace(/_/g, "-")).toString();
        const messages = readSource(sourceFile, localeId);
        files.push({
            content: await format(emitLocaleCatalog(folder, localeId, messages, table)),
            file: path.join(LOCALES_DIR, folder, `${folder}.messages.ts`)
        });
    }
    return files;
}

/** Emits the TypeScript expression for a parsed message. */
export function emitMessage(elements: readonly IcuElement[], context: EmitContext): string {
    const parts: string[] = [];
    let literal = "";
    for (const element of elements) {
        if (element.kind === "literal") {
            literal += element.value;
            continue;
        }
        if (literal !== "") {
            parts.push(escapeWhitespace(JSON.stringify(literal)));
            literal = "";
        }
        parts.push(`(${emitElement(element, context)})`);
    }
    if (literal !== "" || parts.length === 0) {
        parts.push(escapeWhitespace(JSON.stringify(literal)));
    }
    if (parts.length === 1) {
        return parts[0].startsWith("(") ? parts[0].slice(1, -1) : parts[0];
    }
    // A template literal reads like the hand-written catalogs: literals inline, expressions in ${}.
    return (
        "`" +
        parts
            .map(part =>
                part.startsWith("(") ? `\${${part.slice(1, -1)}}` : escapeTemplate(JSON.parse(part) as string)
            )
            .join("") +
        "`"
    );
}

function emitDefaultCatalog(
    target: DefaultCatalogTarget,
    messages: Messages[string],
    table: MessageParameterTable
): string {
    const usage = createUsage();
    const body = emitNamespace(target.namespace, messages, "en-US", table, usage);
    const declaration =
        target.style === "type"
            ? `export const ${target.constName}: ${target.typeName} = ${body};`
            : `export const ${target.constName} = ${body} satisfies ${target.typeName};`;
    return [
        header("i18n/catalogs/en-US.messages.json"),
        emitImports(usage, target.typeName),
        emitHelpers(usage, "en-US"),
        declaration
    ]
        .filter(Boolean)
        .join("\n\n");
}

function emitElement(element: Exclude<IcuElement, { kind: "literal" }>, context: EmitContext): string {
    if (element.kind === "pound") {
        if (context.pound == null) {
            return JSON.stringify("#");
        }
        context.usage.formatNumber = true;
        return `localizeNumber(${context.pound})`;
    }

    const parameter = context.parameters.find(p => p.name === element.name);
    if (parameter == null) {
        throw new Error(`Unknown parameter "${element.name}"`);
    }
    context.usage.parameters.add(parameter.name);
    const name = parameter.name;

    switch (element.kind) {
        case "argument":
            if (parameter.type === "number") {
                context.usage.formatNumber = true;
                return `localizeNumber(${name})`;
            }
            return parameter.optional && !context.present.has(name) ? `${name} ?? ""` : name;
        case "number": {
            context.usage.formatNumber = true;
            const options = element.options == null ? "" : `, ${emitObject(element.options)}`;
            return `localizeNumber(${name}${options})`;
        }
        case "plural": {
            const value = element.offset === 0 ? name : `(${name} - ${element.offset})`;
            const inner: EmitContext = { ...context, pound: value };
            const exact = [...element.options].filter(([key]) => key.startsWith("="));
            const categories = [...element.options].filter(([key]) => !key.startsWith("=") && key !== "other");
            let fallback: string;
            if (categories.length === 0) {
                fallback = emitMessage(element.options.get("other")!, inner);
            } else {
                const rules = element.ordinal ? "ordinal" : "cardinal";
                context.usage.plural = true;
                context.usage.pluralRules.add(rules);
                const forms = [...categories, ["other", element.options.get("other")!] as const]
                    .map(([key, option]) => `${key}: () => ${emitMessage(option, inner)}`)
                    .join(", ");
                fallback = `plural(${rules === "ordinal" ? "ORDINAL_RULES" : "PLURAL_RULES"}.select(${value}), { ${forms} })`;
            }
            return exact.reduceRight(
                (rest, [key, option]) =>
                    `${name} === ${Number(key.slice(1))} ? ${emitMessage(option, inner)} : ${rest}`,
                fallback
            );
        }
        case "select": {
            const subject = parameter.type === "number" ? `String(${name})` : name;
            const absent = parameter.type === "string" ? element.options.get("undefined") : undefined;
            // Inside the branch where an absent or empty value was ruled out, the value is set.
            const present: EmitContext =
                absent == null ? context : { ...context, present: new Set([...context.present, name]) };
            const keyed = [...element.options].filter(([key]) => key !== "other" && key !== "undefined");
            const chain = keyed.reduceRight(
                (rest, [key, option]) =>
                    `${subject} === ${JSON.stringify(key)} ? ${emitMessage(option, present)} : ${rest}`,
                emitMessage(element.options.get("other")!, present)
            );
            return absent == null ? chain : `${name} ? ${chain} : ${emitMessage(absent, context)}`;
        }
    }
}

/** Emits a message function: its parameters, typed, and its body. */
export function emitFunction(
    source: string,
    parameters: readonly MessageParameterInfo[],
    localeId: string,
    usage: EmitUsage
): string {
    const local = createUsage();
    const body = emitMessage(parseIcuMessage(source), {
        localeId,
        parameters,
        pound: null,
        present: new Set(),
        usage: local
    });
    usage.formatNumber ||= local.formatNumber;
    usage.plural ||= local.plural;
    local.pluralRules.forEach(rules => usage.pluralRules.add(rules));
    const signature = parameters
        .map(p => `${local.parameters.has(p.name) ? "" : "_"}${p.name}${p.optional ? "?" : ""}: ${p.type}`)
        .join(", ");
    return `(${signature}) => ${body}`;
}

function emitHelpers(usage: EmitUsage, localeId: string): string {
    const lines: string[] = [];
    if (usage.formatNumber) {
        lines.push(`function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, ${JSON.stringify(localeId)}, options);
}`);
    }
    if (usage.pluralRules.has("cardinal")) {
        lines.push(`const PLURAL_RULES = new Intl.PluralRules(${JSON.stringify(localeId)});`);
    }
    if (usage.pluralRules.has("ordinal")) {
        lines.push(`const ORDINAL_RULES = new Intl.PluralRules(${JSON.stringify(localeId)}, { type: "ordinal" });`);
    }
    if (usage.plural) {
        lines.push(`function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}`);
    }
    return lines.join("\n\n");
}

function emitImports(usage: EmitUsage, typeName: string): string {
    return usage.formatNumber
        ? `import { formatNumber, type ${typeName} } from "@nanahoshi/mona-ui/i18n";`
        : `import type { ${typeName} } from "@nanahoshi/mona-ui/i18n";`;
}

function emitLocaleCatalog(folder: string, localeId: string, messages: Messages, table: MessageParameterTable): string {
    const usage = createUsage();
    const namespaces = [...table.keys()]
        .map(
            namespace => `${namespace}: ${emitNamespace(namespace, messages[namespace] ?? {}, localeId, table, usage)}`
        )
        .join(",\n");
    const constName = `${folder.replace(/-/g, "_").toUpperCase()}_MESSAGES`;
    return [
        header(`${folder}.messages.json`),
        emitImports(usage, "MonaLocaleMessages"),
        emitHelpers(usage, localeId),
        `export const ${constName} = {\n${namespaces}\n} satisfies MonaLocaleMessages;`
    ]
        .filter(Boolean)
        .join("\n\n");
}

function emitNamespace(
    namespace: string,
    messages: Messages[string],
    localeId: string,
    table: MessageParameterTable,
    usage: EmitUsage
): string {
    const entries = [...table.get(namespace)!].map(([key, parameters]) => {
        const source = messages[key];
        if (source == null) {
            throw new Error(`${localeId}: missing message ${namespace}.${key}`);
        }
        const value =
            parameters == null
                ? emitMessage(parseIcuMessage(source), {
                      localeId,
                      parameters: [],
                      pound: null,
                      present: new Set(),
                      usage
                  })
                : emitFunction(source, parameters, localeId, usage);
        return `${key}: ${value}`;
    });
    return `{\n${entries.join(",\n")}\n}`;
}

function emitObject(options: Intl.NumberFormatOptions): string {
    const entries = Object.entries(options)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
    return `{ ${entries.join(", ")} }`;
}

export function createUsage(): EmitUsage {
    return { formatNumber: false, parameters: new Set(), plural: false, pluralRules: new Set() };
}

function escapeTemplate(text: string): string {
    return escapeWhitespace(text.replace(/[\\`]/g, char => `\\${char}`).replace(/\$\{/g, "\\${"));
}

/** Writes whitespace other than spaces, such as the no-break spaces of French, as `\u` escapes. */
function escapeWhitespace(code: string): string {
    return code.replace(
        IRREGULAR_WHITESPACE_REGEX,
        char => `\\u${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`
    );
}

async function format(content: string): Promise<string> {
    const options = await prettier.resolveConfig(ENGLISH_SOURCE_FILE);
    return prettier.format(content, { ...options, parser: "typescript" });
}

function header(source: string): string {
    return `// Generated from ${source} by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run \`npm run generate:locale-catalogs\`.`;
}

/** Reads a JSON source, and throws when it has any issue or misses a message. */
function readSourceFile(
    file: string,
    localeId: string,
    table: MessageParameterTable,
    validate: (data: unknown) => readonly { readonly message: string; readonly path: string }[]
): Messages {
    const messages = JSON.parse(fs.readFileSync(file, "utf8")) as Messages;
    const issues = validate({ direction: "ltr", id: localeId, messages }).map(
        issue => `${issue.path}: ${issue.message}`
    );
    for (const [namespace, keys] of table) {
        for (const key of keys.keys()) {
            if (typeof messages[namespace]?.[key] !== "string") {
                issues.push(`messages.${namespace}.${key}: missing`);
            }
        }
    }
    if (issues.length > 0) {
        throw new Error(`${path.relative(LIBRARY_DIR, file)} has ${issues.length} issue(s):\n- ${issues.join("\n- ")}`);
    }
    return messages;
}

function normalizeNewlines(text: string): string {
    return text.replace(/\r\n/g, "\n");
}

async function main(): Promise<void> {
    const files = await generateLocaleCatalogs();
    if (process.argv.includes("--check")) {
        const stale = files.filter(
            f => !fs.existsSync(f.file) || normalizeNewlines(fs.readFileSync(f.file, "utf8")) !== f.content
        );
        if (stale.length > 0) {
            console.error(
                `These catalogs are out of date. Run \`npm run generate:locale-catalogs\` and commit the result:\n` +
                    stale.map(f => `- ${path.relative(LIBRARY_DIR, f.file)}`).join("\n")
            );
            process.exit(1);
        }
        console.log(`All ${files.length} generated catalogs are up to date.`);
        return;
    }
    for (const file of files) {
        fs.writeFileSync(file.file, file.content, "utf8");
    }
    console.log(`Generated ${files.length} catalogs.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    main().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    });
}
