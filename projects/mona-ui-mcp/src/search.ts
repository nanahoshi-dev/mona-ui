/*
 * A small BM25F index: enough to rank a few thousand page sections and symbols without a dependency. Each field has a
 * weight, so a match in a heading or a symbol's name counts for more than one in body text.
 */

const STOP_WORDS = new Set(
    (
        "a an and are as at be by can do does for from has have how i if in into is it its of on or that the this to " +
        "use using what when where which with you your"
    ).split(" ")
);
const K1 = 1.2;
const B = 0.75;
const PREFIX_WEIGHT = 0.4;
const MAX_PREFIX_TERMS = 24;

export interface SearchHit<T> {
    readonly item: T;
    readonly score: number;
}

interface IndexedDocument<T> {
    readonly fieldLengths: readonly number[];
    readonly item: T;
    readonly termFrequencies: readonly Map<string, number>[];
}

export class SearchIndex<T> {
    readonly #averageLengths: number[];
    readonly #documents: IndexedDocument<T>[] = [];
    readonly #fields: readonly string[];
    readonly #keyFields: readonly number[];
    readonly #postings = new Map<string, Set<number>>();
    readonly #weights: readonly number[];

    /**
     * `fields` maps each field's name to its weight. A document whose `keyFields`, such as its title, have every word
     * of a query scores up to twice as high as one whose body has them, so "date range picker" finds that page before
     * the date picker's, which mentions ranges.
     */
    public constructor(fields: Readonly<Record<string, number>>, keyFields: readonly string[] = []) {
        this.#fields = Object.keys(fields);
        this.#weights = Object.values(fields);
        this.#keyFields = keyFields.map(field => this.#fields.indexOf(field)).filter(index => index >= 0);
        this.#averageLengths = this.#fields.map(() => 0);
    }

    public get size(): number {
        return this.#documents.length;
    }

    public add(item: T, fields: Readonly<Record<string, string>>): void {
        const index = this.#documents.length;
        const termFrequencies = this.#fields.map(field => {
            const frequencies = new Map<string, number>();
            for (const token of tokenize(fields[field] ?? "")) {
                frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
            }
            return frequencies;
        });
        const fieldLengths = termFrequencies.map(frequencies =>
            [...frequencies.values()].reduce((sum, count) => sum + count, 0)
        );
        for (const frequencies of termFrequencies) {
            for (const token of frequencies.keys()) {
                let posting = this.#postings.get(token);
                if (!posting) {
                    posting = new Set();
                    this.#postings.set(token, posting);
                }
                posting.add(index);
            }
        }
        fieldLengths.forEach((length, field) => {
            this.#averageLengths[field] += (length - this.#averageLengths[field]) / (index + 1);
        });
        this.#documents.push({ fieldLengths, item, termFrequencies });
    }

    public search(query: string, limit: number, accept: (item: T) => boolean = () => true): SearchHit<T>[] {
        const tokens = [...new Set(tokenize(query))];
        const terms = this.#expand(tokens);
        const scores = new Map<number, number>();
        for (const { term, weight } of terms) {
            const posting = this.#postings.get(term);
            if (!posting) {
                continue;
            }
            const idf = Math.log(1 + (this.#documents.length - posting.size + 0.5) / (posting.size + 0.5));
            for (const index of posting) {
                const document = this.#documents[index];
                const frequency = this.#fields.reduce((sum, _field, field) => {
                    const count = document.termFrequencies[field].get(term) ?? 0;
                    if (count === 0) {
                        return sum;
                    }
                    const average = this.#averageLengths[field] || 1;
                    const norm = 1 - B + (B * document.fieldLengths[field]) / average;
                    return sum + (this.#weights[field] * count) / norm;
                }, 0);
                const score = (weight * idf * frequency * (K1 + 1)) / (frequency + K1);
                scores.set(index, (scores.get(index) ?? 0) + score);
            }
        }
        return [...scores]
            .map(([index, score]) => {
                const document = this.#documents[index];
                return { item: document.item, score: score * (1 + this.#keyCoverage(document, tokens)) };
            })
            .sort((first, second) => second.score - first.score)
            .filter(hit => accept(hit.item))
            .slice(0, limit);
    }

    /** How many of the query's words a document's key fields have, from 0 to 1. A word may start a longer one. */
    #keyCoverage(document: IndexedDocument<T>, tokens: readonly string[]): number {
        if (this.#keyFields.length === 0 || tokens.length === 0) {
            return 0;
        }
        const covered = tokens.filter(token =>
            this.#keyFields.some(field => {
                const frequencies = document.termFrequencies[field];
                return (
                    frequencies.has(token) ||
                    (token.length >= 3 && [...frequencies.keys()].some(term => term.startsWith(token)))
                );
            })
        );
        return covered.length / tokens.length;
    }

    /** Each query term, plus the indexed terms it's a prefix of, weighted lower, so "sort" finds "sortable". */
    #expand(tokens: readonly string[]): { term: string; weight: number }[] {
        const terms = tokens.map(term => ({ term, weight: 1 }));
        for (const token of tokens.filter(entry => entry.length >= 3)) {
            let added = 0;
            for (const term of this.#postings.keys()) {
                if (term !== token && term.startsWith(token)) {
                    terms.push({ term, weight: PREFIX_WEIGHT });
                    if (++added >= MAX_PREFIX_TERMS) {
                        break;
                    }
                }
            }
        }
        return terms;
    }
}

/**
 * Lowercase words, with identifiers split at their humps and dashes, and kept whole as well: `GridComponent` gives
 * `grid`, `component` and `gridcomponent`, so a query for either part or the whole name matches.
 */
export function tokenize(text: string): string[] {
    const tokens: string[] = [];
    for (const word of text.match(/[\p{L}\p{N}][\p{L}\p{N}_.-]*/gu) ?? []) {
        const parts = word
            .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
            .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
            .toLowerCase()
            .split(/[\s_.-]+/)
            .filter(Boolean);
        for (const part of parts) {
            if (!STOP_WORDS.has(part)) {
                tokens.push(stem(part));
            }
        }
        if (parts.length > 1) {
            tokens.push(parts.join(""));
        }
    }
    return tokens;
}

/**
 * A rough stem, so word forms match: "buttons" and "button", "editing" and "edit", "disabled" and "disable". Short
 * stems are left whole, so "string" stays "string".
 */
export function stem(word: string): string {
    let result = word;
    if (result.length > 4 && /(?:sses|xes|ches|shes)$/.test(result)) {
        result = result.slice(0, -2);
    } else if (result.length > 4 && result.endsWith("ies")) {
        result = `${result.slice(0, -3)}y`;
    } else if (result.length > 3 && result.endsWith("s") && !/(?:ss|us|is)$/.test(result)) {
        result = result.slice(0, -1);
    }
    if (result.endsWith("ing") && result.length - 3 >= 4) {
        result = undouble(result.slice(0, -3));
    } else if (result.endsWith("ed") && !result.endsWith("eed") && result.length - 2 >= 4) {
        result = undouble(result.slice(0, -2));
    }
    if (result.length > 4 && result.endsWith("e")) {
        result = result.slice(0, -1);
    }
    return result;
}

/** "dragg" to "drag", "sett" to "set"; "fill" and "pass" stay. */
function undouble(word: string): string {
    return /([^aeiouslz])\1$/.test(word) ? word.slice(0, -1) : word;
}
