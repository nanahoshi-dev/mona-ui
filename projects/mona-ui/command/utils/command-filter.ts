import type { CommandFilter } from "../models/CommandFilter";

const MARKS = /\p{M}/gu;

/** Lowers case and removes accents, so "cafe" finds "Café". */
const fold = (text: string): string => text.normalize("NFKD").replace(MARKS, "").toLowerCase();

const tokenize = (query: string): string[] => fold(query).split(/\s+/).filter(Boolean);

/**
 * The default filter: an item stays when every word of the query appears in its value or keywords, ignoring case and
 * accents.
 */
export const defaultCommandFilter: CommandFilter = (query, item) => {
    const text = fold([item.value, ...item.keywords].join("\n"));
    return tokenize(query).every(token => text.includes(token));
};

export interface CommandTextPart {
    readonly match: boolean;
    readonly text: string;
}

/**
 * Splits a text into the parts a query matches and the parts it doesn't. Folding can change a string's length, so
 * each folded character remembers where it came from, and a match always covers whole source characters.
 */
export const splitByQuery = (text: string, query: string): readonly CommandTextPart[] => {
    const tokens = tokenize(query);
    if (tokens.length === 0) {
        return [{ match: false, text }];
    }

    let folded = "";
    const starts: number[] = [];
    const ends: number[] = [];
    let offset = 0;
    for (const character of text) {
        const start = offset;
        offset += character.length;
        const piece = fold(character);
        if (piece.length === 0 && ends.length > 0) {
            // A combining mark belongs to the character before it.
            ends[ends.length - 1] = offset;
        }
        for (let index = 0; index < piece.length; index++) {
            starts.push(start);
            ends.push(offset);
        }
        folded += piece;
    }

    const matched = new Array<boolean>(text.length).fill(false);
    for (const token of tokens) {
        let index = folded.indexOf(token);
        while (index !== -1) {
            matched.fill(true, starts[index], ends[index + token.length - 1]);
            index = folded.indexOf(token, index + token.length);
        }
    }

    const parts: CommandTextPart[] = [];
    let partStart = 0;
    for (let index = 1; index <= text.length; index++) {
        if (index === text.length || matched[index] !== matched[partStart]) {
            parts.push({ match: matched[partStart], text: text.slice(partStart, index) });
            partStart = index;
        }
    }
    return parts;
};
