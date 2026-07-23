import type { ClassInputType } from "@nanahoshi/mona-ui/common";

export const classInputToClass = (input: ClassInputType): string => {
    if (input == null) {
        return "";
    }
    if (typeof input === "string") {
        return input;
    }
    if (Array.isArray(input)) {
        return input.join(" ");
    }
    if (typeof input === "object") {
        return Object.entries(input)
            .map(([key, value]) => (!!value ? key : ""))
            .join(" ");
    }
    return "";
};
