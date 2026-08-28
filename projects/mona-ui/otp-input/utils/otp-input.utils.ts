import { AttributeConfig } from "@nanahoshi/mona-ui/internal";
import { OtpInputType } from "../models/OtpInputType";
import { OtpInputSlotVariantProps } from "../styles/otp-input.styles";

const RESERVED_INPUT_ATTRIBUTES = new Set([
    "aria-hidden",
    "aria-invalid",
    "aria-required",
    "class",
    "disabled",
    "maxlength",
    "readonly",
    "required",
    "role",
    "style",
    "type",
    "value"
]);

const COMPONENT_MANAGED_ATTRIBUTES = new Set([
    "aria-label",
    "aria-labelledby",
    "autocomplete",
    "inputmode"
]);

export function findAttribute(attrs: AttributeConfig, name: string): unknown {
    const target = name.toLowerCase();
    for (const [key, value] of Object.entries(attrs)) {
        if (key.toLowerCase() === target) {
            return value;
        }
    }
    return undefined;
}

export function normalizeLength(length: number): number {
    if (typeof length !== "number" || isNaN(length) || !isFinite(length) || length < 1) {
        return 4;
    }
    return Math.floor(length);
}

export function patternTransform(val: unknown): readonly RegExp[] {
    if (!val) {
        return [];
    }
    if (Array.isArray(val)) {
        return val.map(item => (typeof item === "string" ? new RegExp(item) : (item as RegExp)));
    }
    if (typeof val === "string") {
        return [new RegExp(val)];
    }
    if (val instanceof RegExp) {
        return [val];
    }
    return [];
}

export function isValidCharacter(
    char: string,
    type: OtpInputType,
    pattern: readonly RegExp[] | null | undefined
): boolean {
    if (!char || char.length !== 1) {
        return false;
    }
    if (pattern != null && pattern.length > 0) {
        return pattern.every(p => {
            const sanitized = new RegExp(p.source, p.flags.replace(/[gy]/g, ""));
            return sanitized.test(char);
        });
    }
    if (type === "number") {
        return /^[0-9]$/.test(char);
    }
    return /^[a-zA-Z0-9]$/.test(char);
}

export function filterCharacters(
    raw: string,
    type: OtpInputType,
    pattern: readonly RegExp[] | null | undefined,
    maxLength: number
): string {
    if (!raw) {
        return "";
    }
    let result = "";
    for (const char of raw) {
        if (isValidCharacter(char, type, pattern)) {
            result += char;
            if (result.length >= maxLength) {
                break;
            }
        }
    }
    return result;
}

export function normalizeGroupLengths(
    groupLength: number | number[] | null | undefined,
    totalLength: number
): number[] {
    if (totalLength <= 0) {
        return [];
    }
    if (groupLength == null) {
        return [totalLength];
    }
    if (typeof groupLength === "number") {
        if (!isFinite(groupLength) || isNaN(groupLength) || groupLength <= 0) {
            return [totalLength];
        }
        const size = Math.floor(groupLength);
        if (size <= 0) {
            return [totalLength];
        }
        const groups: number[] = [];
        let remaining = totalLength;
        while (remaining > 0) {
            const g = Math.min(size, remaining);
            groups.push(g);
            remaining -= g;
        }
        return groups;
    }
    if (Array.isArray(groupLength)) {
        const groups: number[] = [];
        let remaining = totalLength;
        for (const item of groupLength) {
            if (typeof item === "number" && isFinite(item) && !isNaN(item) && item > 0) {
                const size = Math.floor(item);
                if (size > 0) {
                    const g = Math.min(size, remaining);
                    groups.push(g);
                    remaining -= g;
                    if (remaining <= 0) {
                        break;
                    }
                }
            }
        }
        if (remaining > 0) {
            groups.push(remaining);
        }
        return groups.length > 0 ? groups : [totalLength];
    }
    return [totalLength];
}

export function sanitizeInputAttributes(attrs: AttributeConfig): AttributeConfig {
    const sanitized: AttributeConfig = {};
    for (const [key, val] of Object.entries(attrs)) {
        const normalizedKey = key.toLowerCase();
        if (!RESERVED_INPUT_ATTRIBUTES.has(normalizedKey) && !COMPONENT_MANAGED_ATTRIBUTES.has(normalizedKey)) {
            sanitized[key] = val;
        }
    }
    return sanitized;
}

export function getSlotRoundedClasses(
    rounded: OtpInputSlotVariantProps["rounded"],
    firstSlot: boolean,
    lastSlot: boolean,
    groupSize: number
): string {
    if (groupSize <= 1) {
        return "";
    }
    if (firstSlot) {
        switch (rounded) {
            case "none":
                return "rounded-none";
            case "small":
                return "rounded-s-sm rounded-e-none";
            case "medium":
                return "rounded-s-md rounded-e-none";
            case "large":
                return "rounded-s-lg rounded-e-none";
            case "full":
                return "rounded-s-full rounded-e-none";
            default:
                return "rounded-s-md rounded-e-none";
        }
    }
    if (lastSlot) {
        switch (rounded) {
            case "none":
                return "rounded-none";
            case "small":
                return "rounded-e-sm rounded-s-none";
            case "medium":
                return "rounded-e-md rounded-s-none";
            case "large":
                return "rounded-e-lg rounded-s-none";
            case "full":
                return "rounded-e-full rounded-s-none";
            default:
                return "rounded-e-md rounded-s-none";
        }
    }
    return "rounded-none";
}
