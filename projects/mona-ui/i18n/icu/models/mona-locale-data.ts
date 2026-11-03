import type { MonaLocaleMessages, MonaTextDirection } from "@nanahoshi/mona-ui/i18n";

/**
 * The messages of a {@link MonaLocaleData}: the same namespaces and keys as `MonaLocaleMessages`, with every message
 * written as an ICU MessageFormat string, so a catalog is plain JSON.
 */
export type MonaLocaleDataMessages = {
    readonly [N in keyof MonaLocaleMessages]?: { readonly [K in keyof MonaLocaleMessages[N]]?: string };
};

/** A locale as data, such as a JSON file exported from a translation-management system. */
export interface MonaLocaleData {
    readonly direction: MonaTextDirection;
    readonly id: string;
    readonly messages: MonaLocaleDataMessages;
}

export type MonaLocaleDataIssueCode =
    | "invalid-direction"
    | "invalid-id"
    | "invalid-structure"
    | "missing-other"
    | "not-a-string"
    | "parameter-type"
    | "syntax"
    | "unknown-key"
    | "unknown-namespace"
    | "unknown-parameter";

/** A problem found in a {@link MonaLocaleData} by `validateMonaLocaleData` or `compileMonaLocale`. */
export interface MonaLocaleDataIssue {
    readonly code: MonaLocaleDataIssueCode;
    /** A sentence that describes the problem. */
    readonly message: string;
    /** Where the problem is, such as `messages.pager.pageStatus`. */
    readonly path: string;
}

export interface MonaCompileLocaleOptions {
    /**
     * Throws a `MonaLocaleDataError` listing every issue instead of skipping the messages that have one. Defaults to
     * `false`.
     */
    readonly strict?: boolean;
}

/** A parameter of a message, from the message function's signature. */
export interface MonaMessageParameter {
    readonly name: string;
    readonly optional?: boolean;
    readonly type: "number" | "string";
}
