import { isDevMode } from "@angular/core";
import {
    canonicalizeLocaleId,
    MONA_FALLBACK_LOCALE_ID,
    tryCanonicalizeLocaleId,
    type DeepPartial,
    type MonaLocale,
    type MonaLocaleMessages,
    type MonaTextDirection
} from "@nanahoshi/mona-ui/i18n";
import { MONA_MESSAGE_PARAMETERS } from "./message-parameters";
import type {
    MonaCompileLocaleOptions,
    MonaLocaleData,
    MonaLocaleDataIssue,
    MonaLocaleDataIssueCode,
    MonaMessageParameter
} from "./models/mona-locale-data";
import { formatIcuMessage, type IcuValue } from "./parser/format-icu-message";
import { type IcuElement, IcuSyntaxError, parseIcuMessage } from "./parser/icu-message-parser";

/** Thrown by `compileMonaLocale` in strict mode when the data has issues. */
export class MonaLocaleDataError extends Error {
    public readonly issues: readonly MonaLocaleDataIssue[];

    public constructor(issues: readonly MonaLocaleDataIssue[]) {
        super(
            `[mona-ui] The locale data has ${issues.length} issue(s):\n` +
                issues.map(issue => `- ${issue.path || "(root)"}: ${issue.message}`).join("\n")
        );
        this.name = "MonaLocaleDataError";
        this.issues = issues;
    }
}

interface LocaleDataAnalysis {
    readonly issues: readonly MonaLocaleDataIssue[];
    readonly locale: MonaLocale;
}

/**
 * Compiles locale data, such as a JSON catalog from a translation-management system, into a `MonaLocale`. Messages
 * with parameters become functions; plain messages become strings.
 *
 * By default, a message with an issue (an unknown key or parameter, or a syntax error) is skipped, so components
 * show their English default for it, and a dev-mode warning lists the issues. With `{ strict: true }`, any issue
 * throws a {@link MonaLocaleDataError} instead.
 *
 * ```ts
 * provideMonaI18n({
 *     loadLocale: id => fetch(`/i18n/${id}.json`).then(r => r.json()).then(data => compileMonaLocale(data))
 * });
 * ```
 */
export function compileMonaLocale(data: MonaLocaleData, options?: MonaCompileLocaleOptions): MonaLocale {
    const { issues, locale } = analyzeLocaleData(data);
    if (issues.length > 0) {
        if (options?.strict === true) {
            throw new MonaLocaleDataError(issues);
        }
        if (isDevMode()) {
            console.warn(
                `[mona-ui] compileMonaLocale skipped what it could not compile; those messages fall back to English.`,
                issues
            );
        }
    }
    return locale;
}

/**
 * Checks locale data without compiling it, for example in CI before a catalog exported from a
 * translation-management system ships. Returns every issue; an empty array means the data compiles cleanly.
 */
export function validateMonaLocaleData(data: unknown): readonly MonaLocaleDataIssue[] {
    return analyzeLocaleData(data).issues;
}

function analyzeLocaleData(data: unknown): LocaleDataAnalysis {
    const issues: MonaLocaleDataIssue[] = [];
    const report = (code: MonaLocaleDataIssueCode, path: string, message: string): void => {
        issues.push({ code, message, path });
    };

    if (!isRecord(data)) {
        report("invalid-structure", "", "Locale data must be an object with id, direction and messages.");
        return { issues, locale: { direction: "ltr", id: MONA_FALLBACK_LOCALE_ID, messages: {} } };
    }

    let id = MONA_FALLBACK_LOCALE_ID;
    if (typeof data["id"] === "string" && tryCanonicalizeLocaleId(data["id"]) != null) {
        id = data["id"];
    } else {
        report("invalid-id", "id", "id must be a valid BCP 47 locale id, such as de-DE.");
    }

    let direction: MonaTextDirection = "ltr";
    if (data["direction"] === "ltr" || data["direction"] === "rtl") {
        direction = data["direction"];
    } else {
        report("invalid-direction", "direction", 'direction must be "ltr" or "rtl".');
    }

    const messages: Record<string, Record<string, unknown>> = {};
    const localeId = canonicalizeLocaleId(id);
    const dataMessages = data["messages"];
    if (!isRecord(dataMessages)) {
        report("invalid-structure", "messages", "messages must be an object of namespaces.");
        return { issues, locale: { direction, id, messages: {} } };
    }

    for (const [namespace, namespaceMessages] of Object.entries(dataMessages)) {
        const namespacePath = `messages.${namespace}`;
        if (!Object.hasOwn(MONA_MESSAGE_PARAMETERS, namespace)) {
            report("unknown-namespace", namespacePath, `"${namespace}" is not a message namespace.`);
            continue;
        }
        if (!isRecord(namespaceMessages)) {
            report("invalid-structure", namespacePath, "A namespace must be an object of messages.");
            continue;
        }
        const namespaceParameters = MONA_MESSAGE_PARAMETERS[namespace];
        const compiled: Record<string, unknown> = {};
        for (const [key, source] of Object.entries(namespaceMessages)) {
            const path = `${namespacePath}.${key}`;
            if (!Object.hasOwn(namespaceParameters, key)) {
                report("unknown-key", path, `"${key}" is not a message of the "${namespace}" namespace.`);
                continue;
            }
            if (typeof source !== "string") {
                report("not-a-string", path, "A message must be a string.");
                continue;
            }
            const message = compileMessage(source, namespaceParameters[key], localeId, path, report);
            if (message !== undefined) {
                compiled[key] = message;
            }
        }
        messages[namespace] = compiled;
    }

    return { issues, locale: { direction, id, messages: messages as DeepPartial<MonaLocaleMessages> } };
}

function checkArguments(
    elements: readonly IcuElement[],
    parameters: readonly MonaMessageParameter[],
    path: string,
    report: (code: MonaLocaleDataIssueCode, path: string, message: string) => void
): boolean {
    let valid = true;
    for (const element of elements) {
        if (element.kind === "literal" || element.kind === "pound") {
            continue;
        }
        const parameter = parameters.find(p => p.name === element.name);
        if (parameter == null) {
            const known =
                parameters.length === 0 ? "it takes none" : `it takes ${parameters.map(p => p.name).join(", ")}`;
            report("unknown-parameter", path, `"${element.name}" is not a parameter of this message; ${known}.`);
            valid = false;
            continue;
        }
        if ((element.kind === "number" || element.kind === "plural") && parameter.type !== "number") {
            report(
                "parameter-type",
                path,
                `"${element.name}" is a ${parameter.type}, so it cannot be a ${element.kind}.`
            );
            valid = false;
        }
        if (element.kind === "plural" || element.kind === "select") {
            for (const option of element.options.values()) {
                valid = checkArguments(option, parameters, path, report) && valid;
            }
        }
    }
    return valid;
}

/** Compiles one message to a string or a function, or reports its issues and returns `undefined`. */
function compileMessage(
    source: string,
    parameters: readonly MonaMessageParameter[] | null,
    localeId: string,
    path: string,
    report: (code: MonaLocaleDataIssueCode, path: string, message: string) => void
): unknown {
    let elements: readonly IcuElement[];
    try {
        elements = parseIcuMessage(source);
    } catch (error) {
        if (error instanceof IcuSyntaxError) {
            report(error.kind, path, error.message);
            return undefined;
        }
        throw error;
    }
    if (!checkArguments(elements, parameters ?? [], path, report)) {
        return undefined;
    }
    if (parameters == null) {
        return formatIcuMessage(elements, new Map(), localeId);
    }
    return (...args: readonly IcuValue[]): string =>
        formatIcuMessage(elements, new Map(parameters.map((p, index) => [p.name, args[index]])), localeId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value != null && !Array.isArray(value);
}
