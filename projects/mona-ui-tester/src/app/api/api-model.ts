/**
 * The shape of the API reference: what `scripts/api-extractor.ts` reads from the library, and the files
 * `scripts/generate-api-docs.ts --data` writes for the `/api` pages to load. Keep this file free of Angular imports, so
 * the scripts can use it under plain Node.
 */

export type ApiSymbolKind =
    "class" | "component" | "constant" | "directive" | "enum" | "function" | "interface" | "pipe" | "service" | "type";

export interface ApiMember {
    /** The name consumers bind, when an input or output is aliased. */
    readonly alias?: string;
    readonly defaultValue?: string;
    readonly description: string;
    readonly name: string;
    readonly optional?: boolean;
    readonly readonly?: boolean;
    readonly required?: boolean;
    readonly twoWay?: boolean;
    readonly type: string;
}

export interface ApiMethod {
    readonly description: string;
    readonly name: string;
    readonly signature: string;
}

export interface ApiEnumMember {
    readonly description: string;
    readonly name: string;
    readonly value: string;
}

export interface ApiTemplateContext {
    readonly members: readonly ApiMember[];
    readonly type: string;
}

export interface ApiSymbol {
    readonly description: string;
    readonly enumMembers?: readonly ApiEnumMember[];
    readonly exportAs?: string;
    readonly extends?: readonly string[];
    /** The form control contract it implements, when it has one. */
    readonly implements?: readonly string[];
    readonly inputs?: readonly ApiMember[];
    readonly kind: ApiSymbolKind;
    readonly methods?: readonly ApiMethod[];
    readonly name: string;
    readonly outputs?: readonly ApiMember[];
    readonly pipeName?: string;
    readonly properties?: readonly ApiMember[];
    readonly selector?: string;
    /** The declaration's own source, for type aliases, functions and constants. */
    readonly signature?: string;
    /** What a template directive's `let-` variables can read, from its `ngTemplateContextGuard`. */
    readonly templateContext?: ApiTemplateContext;
    readonly typeParameters?: readonly string[];
}

/** A page of the documentation site, under `/components`. */
export interface ApiGuidePage {
    readonly path: string;
    readonly title: string;
}

/** The members a symbol takes from a base type that is itself exported, so its own page describes them. */
export interface ApiInheritance extends Pick<ApiSymbol, "inputs" | "methods" | "outputs" | "properties"> {
    /** The base type's name. */
    readonly from: string;
}

/** One symbol on its reference page. */
export interface ApiSymbolReference extends ApiSymbol {
    /** Members from exported base types, nearest base first. */
    readonly inherited?: readonly ApiInheritance[];
    /** The guide page that documents it, if one does. */
    readonly page?: ApiGuidePage;
    /** The exported names whose API mentions this one. */
    readonly usedBy?: readonly string[];
}

/** One entry point's reference, as `/assets/api/<entry point>.json`. */
export interface ApiEntryPointReference {
    /** Every exported name the symbols mention, with the entry point that exports it. */
    readonly links: Readonly<Record<string, string>>;
    readonly name: string;
    /** The guide pages for this entry point, in navigation order. */
    readonly pages: readonly ApiGuidePage[];
    readonly symbols: readonly ApiSymbolReference[];
}

/** What the reference's index shows of a symbol. */
export interface ApiSymbolSummary {
    readonly kind: ApiSymbolKind;
    readonly name: string;
    /** The description's first sentence, as markdown. */
    readonly summary: string;
}

export interface ApiEntryPointSummary {
    readonly name: string;
    readonly pages: readonly ApiGuidePage[];
    readonly symbols: readonly ApiSymbolSummary[];
}

/** Every entry point and what it exports, as `/assets/api/index.json`. */
export interface ApiReferenceIndex {
    readonly entryPoints: readonly ApiEntryPointSummary[];
}
