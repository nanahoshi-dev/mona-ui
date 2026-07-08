/**
 * Generates a unique control ID for an element.
 * The ID consists of a prefix, a random hexadecimal string, and a suffix.
 * @param {number} [level=0] - The nesting level of the element. This increases the length of the generated ID.
 * @param {number} [length=7] - The base length of the random part of the ID.
 * @returns {string} A unique control ID string for use for elements.
 */
export const createElementControlId = (level: number = 0, length: number = 7): string => {
    const idLength = length + level;
    const prefix = "mona-";
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const array = new Uint8Array(Math.ceil(idLength / 2));
        crypto.getRandomValues(array);
        const randomId = Array.from(array, byte => byte.toString(16).padStart(2, "0"))
            .join("")
            .substring(0, idLength);
        return `${prefix}:${randomId}:`;
    }
    let hex = "";
    const chars = "0123456789abcdef";

    for (let i = 0; i < idLength; i++) {
        hex += chars[Math.floor(Math.random() * 16)];
    }
    return `${prefix}:${hex}:`;
};
