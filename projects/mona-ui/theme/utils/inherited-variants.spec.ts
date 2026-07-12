import { cva } from "class-variance-authority";
import { describe, expect, it } from "vitest";
import { createInheritedVariants } from "./inherited-variants";

describe("createInheritedVariants", () => {
    const base = cva("flex border shadow-sm", {
        variants: {
            size: {
                small: "h-8 px-2",
                large: "h-10 px-4"
            },
            selected: {
                true: "bg-primary text-primary-foreground",
                false: "bg-background"
            }
        },
        compoundVariants: [{ size: "large", selected: true, class: "font-semibold" }],
        defaultVariants: { size: "small", selected: false }
    });

    it("inherits Mona classes and applies additions and removals", () => {
        const inherited = createInheritedVariants(base, {
            add: "rounded-xl shadow-none",
            remove: "border",
            variants: {
                size: { small: { add: "px-3", remove: "px-2" } }
            }
        });

        const classes = inherited({ size: "small" });

        expect(classes).toContain("flex");
        expect(classes).not.toContain("border");
        expect(classes).toContain("rounded-xl");
        expect(classes).toContain("px-3");
        expect(classes).not.toContain("px-2");
        expect(classes).not.toContain("shadow-sm");
    });

    it("supports derived defaults and compound variant deltas", () => {
        const inherited = createInheritedVariants(base, {
            defaultVariants: { size: "large", selected: true },
            compoundVariants: [
                {
                    when: { size: "large", selected: true },
                    add: "font-bold",
                    remove: "font-semibold"
                }
            ]
        });

        const classes = inherited();

        expect(classes).toContain("h-10");
        expect(classes).toContain("bg-primary");
        expect(classes).toContain("font-bold");
        expect(classes).not.toContain("font-semibold");
    });
});
