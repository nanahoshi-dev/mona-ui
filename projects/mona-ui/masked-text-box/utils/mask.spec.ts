import { describe, expect, it } from "vitest";
import {
    displayMask,
    editMask,
    formatMaskedValue,
    isMaskComplete,
    type MaskSlots,
    parseMask,
    partAt,
    slotsFromValue,
    valueFromSlots
} from "./mask";

const PHONE = parseMask("(000) 000-0000");

const slotsOf = (value: string, mask = PHONE, includeLiterals = false): MaskSlots =>
    slotsFromValue(mask, value, includeLiterals);

describe("parseMask", () => {
    it("splits a mask into slots and literals", () => {
        const mask = parseMask("(00) L?");
        expect(mask.parts.map(part => (part.literal ? part.char : part.kind))).toEqual([
            "(",
            "digit",
            "digit",
            ")",
            " ",
            "letter",
            "letter"
        ]);
        expect(mask.slotParts).toEqual([1, 2, 5, 6]);
        expect(mask.parts[6]).toMatchObject({ optional: true });
    });

    it("takes the character after a backslash as a literal", () => {
        const mask = parseMask("\\0\\L-0");
        expect(mask.parts.map(part => (part.literal ? part.char : part.kind))).toEqual(["0", "L", "-", "digit"]);
    });

    it("uses custom rules, which can replace built-in ones, and makes their slots required", () => {
        const mask = parseMask("HH0", { 0: /[0-5]/, H: /[0-9a-f]/gi });
        expect(mask.parts.map(part => (part.literal ? part.char : part.kind))).toEqual(["custom", "custom", "custom"]);
        const slot = mask.parts[0];
        // A global pattern is tested afresh for every character.
        expect(slot.literal ? null : [slot.accept("a"), slot.accept("b"), slot.accept("g")]).toEqual(["a", "b", null]);
        expect(mask.parts[2]).toMatchObject({ optional: false });
        expect(mask.parts[2].literal ? null : mask.parts[2].accept("7")).toBeNull();
    });
});

describe("built-in rules", () => {
    const accept = (rule: string, char: string): string | null => {
        const part = parseMask(rule).parts[0];
        return part.literal ? null : part.accept(char);
    };

    it("takes digits of any script and full-width forms as ASCII", () => {
        expect(accept("0", "٥")).toBe("5");
        expect(accept("0", "５")).toBe("5");
        expect(accept("0", "a")).toBeNull();
        expect(accept("L", "Ｂ")).toBe("B");
        expect(accept("L", "é")).toBe("é");
        expect(accept("L", "1")).toBeNull();
        expect(accept("A", "z")).toBe("z");
        expect(accept("A", "-")).toBeNull();
    });

    it("takes + and - in a # slot, and anything but a space in & and C slots", () => {
        expect(accept("#", "+")).toBe("+");
        expect(accept("#", "-")).toBe("-");
        expect(accept("#", "x")).toBeNull();
        expect(accept("&", "%")).toBe("%");
        expect(accept("&", " ")).toBeNull();
        expect(accept("C", "٥")).toBe("٥");
    });
});

describe("values", () => {
    it("reads a value in place, with or without literals, and a space as an empty slot", () => {
        expect(slotsOf("5551234567")).toEqual(Array.from("5551234567"));
        expect(slotsOf("(555) 123-4567", PHONE, true)).toEqual(Array.from("5551234567"));
        expect(slotsOf("55 12")).toEqual(["5", "5", null, "1", "2", null, null, null, null, null]);
    });

    it("fits a value that doesn't line up, as a paste would", () => {
        expect(slotsOf("(555) 123-4567")).toEqual(Array.from("5551234567"));
        expect(slotsOf("555.123.4567", PHONE, true)).toEqual(Array.from("5551234567"));
        expect(slotsOf("555-12")).toEqual(["5", "5", "5", "1", "2", null, null, null, null, null]);
    });

    it("writes the characters up to the last filled slot, with literals when asked", () => {
        const slots = slotsOf("55 12");
        expect(valueFromSlots(PHONE, slots, false)).toBe("55 12");
        expect(valueFromSlots(PHONE, slots, true)).toBe("(55 ) 12");
        expect(valueFromSlots(PHONE, slotsOf(""), true)).toBe("");
    });

    it("adds the literals at the end of the mask once its last slot is filled", () => {
        const weight = parseMask("000 kg");
        expect(valueFromSlots(weight, slotsFromValue(weight, "12", false), true)).toBe("12");
        expect(valueFromSlots(weight, slotsFromValue(weight, "123", false), true)).toBe("123 kg");
    });

    it("round-trips every value it writes", () => {
        for (const value of ["", "5", "55 12", "5551234567", " 5"]) {
            expect(valueFromSlots(PHONE, slotsOf(value), false)).toBe(value.trimEnd());
        }
    });
});

describe("displayMask", () => {
    it("shows the filled part as text and the rest as the ghost", () => {
        expect(displayMask(PHONE, slotsOf(""), "_")).toMatchObject({ ghost: "(___) ___-____", text: "", textParts: 0 });
        expect(displayMask(PHONE, slotsOf("55"), "_")).toMatchObject({ ghost: "_) ___-____", text: "(55" });
    });

    it("keeps the literals after the last character in the text, so the caret waits for the next one", () => {
        expect(displayMask(PHONE, slotsOf("555"), "_")).toMatchObject({
            ghost: "___-____",
            text: "(555) ",
            textParts: 6
        });
    });

    it("shows an empty slot inside the text as the prompt", () => {
        expect(displayMask(PHONE, slotsOf("5 5"), "•").text).toBe("(5•5) ");
    });

    it("counts offsets in UTF-16, so a character outside the BMP takes two", () => {
        const mask = parseMask("&-&");
        const display = displayMask(mask, slotsFromValue(mask, "😀x", false), "_");
        expect(display.text).toBe("😀-x");
        expect(display.offsets).toEqual([0, 2, 3, 4]);
        expect(partAt(display, 2)).toBe(1);
        expect(partAt(display, 4)).toBe(3);
    });
});

describe("editMask", () => {
    const type = (slots: MaskSlots, at: number, text: string, end = at) =>
        editMask(PHONE, slots, at, end, "insert", text);

    it("fills slots from the caret and puts the caret before the next slot", () => {
        const result = type(slotsOf(""), 0, "555");
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("555");
        expect(result.caret).toBe(6);
    });

    it("takes a literal typed where the mask has it, and skips characters a slot doesn't take", () => {
        const result = type(slotsOf(""), 0, "(555) 123-4567 ext. 89");
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("5551234567");
        expect(result.rejected).toBeNull();
    });

    it("overwrites a filled slot", () => {
        const result = type(slotsOf("5551234567"), 7, "9");
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("5551934567");
        expect(result.caret).toBe(8);
    });

    it("reports the slot that turned down text that didn't fit at all", () => {
        const result = type(slotsOf("555"), 6, "x");
        expect(result.rejected).toMatchObject({ kind: "digit" });
        expect(result.slots).toEqual(slotsOf("555"));
    });

    it("drops what's left once the slots run out", () => {
        const result = type(slotsOf("555123456"), 13, "789");
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("5551234567");
        expect(result.rejected).toBeNull();
    });

    it("replaces a selection: the selected slots empty first", () => {
        const result = type(slotsOf("5551234567"), 1, "9", 4);
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("9  1234567");
    });

    it("empties the slot before the caret with Backspace, past literals, without moving the rest", () => {
        const result = editMask(PHONE, slotsOf("5551234567"), 6, 6, "deleteBackward");
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("55 1234567");
        expect(result.caret).toBe(3);
    });

    it("empties the slot after the caret with Delete, and steps past it", () => {
        const result = editMask(PHONE, slotsOf("5551234567"), 4, 4, "deleteForward");
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("555 234567");
        expect(result.caret).toBe(7);
    });

    it("does nothing at the ends", () => {
        const slots = slotsOf("555");
        expect(editMask(PHONE, slots, 0, 0, "deleteBackward").slots).toBe(slots);
        expect(editMask(PHONE, slots, 14, 14, "deleteForward").slots).toBe(slots);
    });

    it("empties a group at a time for word deletion", () => {
        const backward = editMask(PHONE, slotsOf("5551234567"), 8, 8, "deleteGroupBackward");
        expect(valueFromSlots(PHONE, backward.slots, false)).toBe("555  34567");
        expect(backward.caret).toBe(6);
        const forward = editMask(PHONE, slotsOf("5551234567"), 7, 7, "deleteGroupForward");
        expect(valueFromSlots(PHONE, forward.slots, false)).toBe("5551  4567");
        expect(forward.caret).toBe(9);
    });

    it("empties everything before or after the caret for line deletion", () => {
        expect(valueFromSlots(PHONE, editMask(PHONE, slotsOf("5551234567"), 6, 6, "deleteToStart").slots, false)).toBe(
            "   1234567"
        );
        expect(valueFromSlots(PHONE, editMask(PHONE, slotsOf("5551234567"), 6, 6, "deleteToEnd").slots, false)).toBe(
            "555"
        );
    });

    it("empties a selection for any deletion", () => {
        const result = editMask(PHONE, slotsOf("5551234567"), 0, 14, "deleteBackward");
        expect(valueFromSlots(PHONE, result.slots, false)).toBe("");
        expect(result.caret).toBe(0);
    });
});

describe("isMaskComplete and formatMaskedValue", () => {
    it("checks that every required slot is filled", () => {
        expect(isMaskComplete("5551234567", "(000) 000-0000")).toBe(true);
        expect(isMaskComplete("555123456", "(000) 000-0000")).toBe(false);
        expect(isMaskComplete("", "(000) 000-0000")).toBe(false);
        expect(isMaskComplete("94103", "00000-9999")).toBe(true);
        expect(isMaskComplete("(555) 123-4567", "(000) 000-0000", { includeLiterals: true })).toBe(true);
        expect(isMaskComplete("ab", "HH", { rules: { H: /[0-9a-f]/ } })).toBe(true);
    });

    it("formats a value with the mask's literals", () => {
        expect(formatMaskedValue("5551234567", "(000) 000-0000")).toBe("(555) 123-4567");
        expect(formatMaskedValue("555", "(000) 000-0000")).toBe("(555");
        expect(formatMaskedValue("", "(000) 000-0000")).toBe("");
    });
});
