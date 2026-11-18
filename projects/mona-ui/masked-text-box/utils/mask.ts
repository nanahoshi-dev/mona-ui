import { normalizeLocalizedDigits } from "@nanahoshi/mona-ui/i18n";
import type { MaskOptions, MaskRules } from "../models/MaskRules";

/** What a slot takes, which also picks the message read out when a character doesn't fit. */
export type MaskSlotKind = "any" | "custom" | "digit" | "digitOrSign" | "letter" | "letterOrDigit";

export interface MaskLiteral {
    readonly char: string;
    readonly literal: true;
}

export interface MaskSlot {
    /** The character as the slot keeps it, or null when it doesn't fit. */
    readonly accept: (char: string) => string | null;
    readonly kind: MaskSlotKind;
    readonly literal: false;
    readonly optional: boolean;
}

export type MaskPart = MaskLiteral | MaskSlot;

export interface ParsedMask {
    readonly parts: readonly MaskPart[];
    /** The slot index of each part, or -1 for a literal. */
    readonly slotIndexOfPart: readonly number[];
    /** The part index of each slot. */
    readonly slotParts: readonly number[];
}

/** Each slot's character, or null while it's empty. */
export type MaskSlots = readonly (string | null)[];

export interface MaskDisplay {
    /** The rest of the mask after the text: a prompt for each slot, and the literals between them. */
    readonly ghost: string;
    /** UTF-16 offset of each part in the text followed by the ghost, then the length of both. */
    readonly offsets: readonly number[];
    /** What the input holds: every part up to the last filled slot, with the literals after it. */
    readonly text: string;
    /** How many parts the text covers. */
    readonly textParts: number;
}

export type MaskEditKind =
    | "deleteBackward"
    | "deleteForward"
    | "deleteGroupBackward"
    | "deleteGroupForward"
    | "deleteToEnd"
    | "deleteToStart"
    | "insert";

export interface MaskEditResult {
    /** The part the caret goes before. */
    readonly caret: number;
    /** The slot that turned the text down, when none of it fit. */
    readonly rejected: MaskSlot | null;
    readonly slots: MaskSlots;
}

interface BuiltInRule {
    readonly kind: MaskSlotKind;
    readonly optional: boolean;
    readonly test: (char: string) => boolean;
}

const DIGIT = /^[0-9]$/;
const LETTER = /^\p{L}$/u;
const SPACE = /^\s$/u;

const isDigit = (char: string): boolean => DIGIT.test(char);
const isLetter = (char: string): boolean => LETTER.test(char);
const isLetterOrDigit = (char: string): boolean => isDigit(char) || isLetter(char);
const isDigitOrSign = (char: string): boolean => isDigit(char) || char === "+" || char === "-";
const isNotSpace = (char: string): boolean => !SPACE.test(char);

const BUILT_IN_RULES: ReadonlyMap<string, BuiltInRule> = new Map([
    ["#", { kind: "digitOrSign", optional: true, test: isDigitOrSign }],
    ["&", { kind: "any", optional: false, test: isNotSpace }],
    ["0", { kind: "digit", optional: false, test: isDigit }],
    ["9", { kind: "digit", optional: true, test: isDigit }],
    ["?", { kind: "letter", optional: true, test: isLetter }],
    ["A", { kind: "letterOrDigit", optional: false, test: isLetterOrDigit }],
    ["C", { kind: "any", optional: true, test: isNotSpace }],
    ["L", { kind: "letter", optional: false, test: isLetter }],
    ["a", { kind: "letterOrDigit", optional: true, test: isLetterOrDigit }]
]);

function builtInSlot(rule: BuiltInRule): MaskSlot {
    // Digits of any script, and the full-width letters and digits CJK input methods type, are kept as ASCII.
    const fold = rule.kind !== "any";
    return {
        accept: char => {
            const folded = fold ? normalizeLocalizedDigits(char) : char;
            return rule.test(folded) ? folded : null;
        },
        kind: rule.kind,
        literal: false,
        optional: rule.optional
    };
}

function customSlot(pattern: RegExp): MaskSlot {
    // A global or sticky pattern would carry lastIndex from one test to the next.
    const rule = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
    return {
        accept: char => (rule.test(char) && !SPACE.test(char) ? char : null),
        kind: "custom",
        literal: false,
        optional: false
    };
}

function lastFilledSlot(slots: MaskSlots): number {
    for (let slot = slots.length - 1; slot >= 0; slot--) {
        if (slots[slot] != null) {
            return slot;
        }
    }
    return -1;
}

function readPositionally(mask: ParsedMask, chars: readonly string[], includeLiterals: boolean): MaskSlots | null {
    const slots = emptySlots(mask);
    if (includeLiterals) {
        if (chars.length > mask.parts.length) {
            return null;
        }
        for (const [index, char] of chars.entries()) {
            const part = mask.parts[index];
            if (part.literal) {
                if (char !== part.char) {
                    return null;
                }
                continue;
            }
            if (char === " ") {
                continue;
            }
            const accepted = part.accept(char);
            if (accepted == null) {
                return null;
            }
            slots[mask.slotIndexOfPart[index]] = accepted;
        }
        return slots;
    }
    if (chars.length > mask.slotParts.length) {
        return null;
    }
    for (const [slot, char] of chars.entries()) {
        if (char === " ") {
            continue;
        }
        const accepted = (mask.parts[mask.slotParts[slot]] as MaskSlot).accept(char);
        if (accepted == null) {
            return null;
        }
        slots[slot] = accepted;
    }
    return slots;
}

/** Clears the slots among the parts from `from` up to `to`. */
export function clearParts(mask: ParsedMask, slots: MaskSlots, from: number, to: number): MaskSlots {
    const next = [...slots];
    for (let part = Math.max(0, from); part < Math.min(to, mask.parts.length); part++) {
        const slot = mask.slotIndexOfPart[part];
        if (slot >= 0) {
            next[slot] = null;
        }
    }
    return next;
}

/** What the input shows for the slots, and where each part starts in it. */
export function displayMask(mask: ParsedMask, slots: MaskSlots, prompt: string): MaskDisplay {
    const last = lastFilledSlot(slots);
    let textParts = last < 0 ? 0 : mask.slotParts[last] + 1;
    // The literals after the last character go with it, so the caret waits where the next one goes.
    while (textParts > 0 && textParts < mask.parts.length && mask.parts[textParts].literal) {
        textParts++;
    }
    let text = "";
    let ghost = "";
    const offsets: number[] = [];
    for (const [index, part] of mask.parts.entries()) {
        offsets.push(text.length + ghost.length);
        const shown = part.literal ? part.char : (slots[mask.slotIndexOfPart[index]] ?? prompt);
        if (index < textParts) {
            text += shown;
        } else {
            ghost += shown;
        }
    }
    offsets.push(text.length + ghost.length);
    return { ghost, offsets, text, textParts };
}

/**
 * Applies an edit to the parts selected from `start` up to `end`. Slots keep their places: typing fills or overwrites
 * the slots from the caret on, and deleting empties them.
 */
export function editMask(
    mask: ParsedMask,
    slots: MaskSlots,
    start: number,
    end: number,
    kind: MaskEditKind,
    text: string = ""
): MaskEditResult {
    if (kind === "insert") {
        const cleared = start < end ? clearParts(mask, slots, start, end) : slots;
        const insertion = insertText(mask, cleared, start, text);
        let caret = insertion.end;
        while (caret < mask.parts.length && mask.parts[caret].literal) {
            caret++;
        }
        return { caret, rejected: insertion.filled === 0 ? insertion.rejected : null, slots: insertion.slots };
    }
    if (start < end) {
        return { caret: start, rejected: null, slots: clearParts(mask, slots, start, end) };
    }
    const unchanged: MaskEditResult = { caret: start, rejected: null, slots };
    switch (kind) {
        case "deleteBackward": {
            const part = slotPartBefore(mask, start);
            return part < 0
                ? unchanged
                : { caret: part, rejected: null, slots: clearParts(mask, slots, part, part + 1) };
        }
        case "deleteForward": {
            // Nothing moves up into the emptied slot, so the caret steps past it, as it would past a deleted character.
            const part = slotPartFrom(mask, start);
            return part < 0
                ? unchanged
                : { caret: part + 1, rejected: null, slots: clearParts(mask, slots, part, part + 1) };
        }
        case "deleteGroupBackward": {
            const part = slotPartBefore(mask, start);
            if (part < 0) {
                return unchanged;
            }
            const from = groupStart(mask, part);
            return { caret: from, rejected: null, slots: clearParts(mask, slots, from, part + 1) };
        }
        case "deleteGroupForward": {
            const part = slotPartFrom(mask, start);
            if (part < 0) {
                return unchanged;
            }
            const to = groupEnd(mask, part);
            return { caret: to, rejected: null, slots: clearParts(mask, slots, part, to) };
        }
        case "deleteToEnd":
            return { caret: start, rejected: null, slots: clearParts(mask, slots, start, mask.parts.length) };
        case "deleteToStart":
            return { caret: 0, rejected: null, slots: clearParts(mask, slots, 0, start) };
    }
}

/** Every slot empty. */
export function emptySlots(mask: ParsedMask): (string | null)[] {
    return mask.slotParts.map(() => null);
}

/**
 * Formats a value for display with its mask's literals, such as `"5551234567"` as `"(555) 123-4567"` for the mask
 * `"(000) 000-0000"`. It reads the value as a masked text box with the same options would, and stops after the last
 * character the value has. An empty slot before it shows as a space.
 * @param value The value, as the masked text box emits it.
 * @param mask The mask, as given to the masked text box.
 * @param options The masked text box's `includeLiterals` and `rules`.
 */
export function formatMaskedValue(value: string, mask: string, options: MaskOptions = {}): string {
    const parsed = parseMask(mask, options.rules);
    return valueFromSlots(parsed, slotsFromValue(parsed, value, options.includeLiterals ?? false), true);
}

/** The part after the last slot of the group a slot is in. A group is a run of slots with no literal between them. */
export function groupEnd(mask: ParsedMask, slotPart: number): number {
    let part = slotPart;
    while (part < mask.parts.length && !mask.parts[part].literal) {
        part++;
    }
    return part;
}

/** The first slot of the group a slot is in. */
export function groupStart(mask: ParsedMask, slotPart: number): number {
    let part = slotPart;
    while (part > 0 && !mask.parts[part - 1].literal) {
        part--;
    }
    return part;
}

/**
 * Fills the slots from part `at` on with the text's characters, in order. A character that is the next literal moves
 * past it, a character a slot doesn't take is skipped, and what's left once the slots run out is dropped.
 */
export function insertText(
    mask: ParsedMask,
    slots: MaskSlots,
    at: number,
    text: string
): { end: number; filled: number; rejected: MaskSlot | null; slots: MaskSlots } {
    const { parts, slotIndexOfPart } = mask;
    const next = [...slots];
    let part = at;
    let filled = 0;
    let rejected: MaskSlot | null = null;
    for (const char of text) {
        let target = part;
        while (target < parts.length && parts[target].literal && (parts[target] as MaskLiteral).char !== char) {
            target++;
        }
        if (target >= parts.length) {
            break;
        }
        const targetPart = parts[target];
        if (targetPart.literal) {
            part = target + 1;
            continue;
        }
        const accepted = targetPart.accept(char);
        if (accepted == null) {
            rejected ??= targetPart;
            continue;
        }
        next[slotIndexOfPart[target]] = accepted;
        part = target + 1;
        filled++;
    }
    return { end: part, filled, rejected, slots: next };
}

/**
 * Whether a value fills every required slot of a mask, for a validator. An empty value doesn't, so let an optional
 * field's validator pass `""` first.
 * @param value The value, as the masked text box emits it.
 * @param mask The mask, as given to the masked text box.
 * @param options The masked text box's `includeLiterals` and `rules`.
 */
export function isMaskComplete(value: string, mask: string, options: MaskOptions = {}): boolean {
    const parsed = parseMask(mask, options.rules);
    return slotsComplete(parsed, slotsFromValue(parsed, value, options.includeLiterals ?? false));
}

/** Splits a mask into slots and literals. A backslash makes the character after it a literal. */
export function parseMask(mask: string, rules: MaskRules = {}): ParsedMask {
    const parts: MaskPart[] = [];
    const chars = Array.from(mask);
    for (let index = 0; index < chars.length; index++) {
        const char = chars[index];
        const builtIn = BUILT_IN_RULES.get(char);
        if (char === "\\" && index + 1 < chars.length) {
            index++;
            parts.push({ char: chars[index], literal: true });
        } else if (Object.hasOwn(rules, char)) {
            parts.push(customSlot(rules[char]));
        } else if (builtIn) {
            parts.push(builtInSlot(builtIn));
        } else {
            parts.push({ char, literal: true });
        }
    }
    const slotParts: number[] = [];
    const slotIndexOfPart = parts.map((part, index) => {
        if (part.literal) {
            return -1;
        }
        slotParts.push(index);
        return slotParts.length - 1;
    });
    return { parts, slotIndexOfPart, slotParts };
}

/** The part a position in the shown text falls before. */
export function partAt(display: MaskDisplay, position: number): number {
    let part = 0;
    while (part < display.textParts && display.offsets[part + 1] <= position) {
        part++;
    }
    return part;
}

/** The last slot before a part, or -1. */
export function slotPartBefore(mask: ParsedMask, part: number): number {
    for (let index = Math.min(part, mask.parts.length) - 1; index >= 0; index--) {
        if (!mask.parts[index].literal) {
            return index;
        }
    }
    return -1;
}

/** The first slot at or after a part, or -1. */
export function slotPartFrom(mask: ParsedMask, part: number): number {
    for (let index = Math.max(0, part); index < mask.parts.length; index++) {
        if (!mask.parts[index].literal) {
            return index;
        }
    }
    return -1;
}

/** Whether every required slot is filled. */
export function slotsComplete(mask: ParsedMask, slots: MaskSlots): boolean {
    return mask.slotParts.every((part, slot) => slots[slot] != null || (mask.parts[part] as MaskSlot).optional);
}

/**
 * Reads a value into slots. A value that lines up with the mask fills the slots in place, and a space empties one.
 * Anything else, such as a phone number written another way, is fitted in as a paste would be.
 */
export function slotsFromValue(mask: ParsedMask, value: string, includeLiterals: boolean): MaskSlots {
    if (!value) {
        return emptySlots(mask);
    }
    const chars = Array.from(value);
    return readPositionally(mask, chars, includeLiterals) ?? insertText(mask, emptySlots(mask), 0, value).slots;
}

/**
 * The value for the slots: their characters, with the literals between them when `includeLiterals` is set, up to the
 * last filled slot. An empty slot before it is a space. Literals at the mask's end come along once its last slot is
 * filled.
 */
export function valueFromSlots(mask: ParsedMask, slots: MaskSlots, includeLiterals: boolean): string {
    const last = lastFilledSlot(slots);
    if (last < 0) {
        return "";
    }
    if (!includeLiterals) {
        return slots
            .slice(0, last + 1)
            .map(char => char ?? " ")
            .join("");
    }
    const end = last === mask.slotParts.length - 1 ? mask.parts.length : mask.slotParts[last] + 1;
    return mask.parts
        .slice(0, end)
        .map((part, index) => (part.literal ? part.char : (slots[mask.slotIndexOfPart[index]] ?? " ")))
        .join("");
}
