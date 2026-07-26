import { Component, computed, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import {
    skeletonBaseThemeVariants,
    type SkeletonVariantInput,
    type SkeletonVariantProps
} from "../../styles/skeleton.styles";

/**
 * @description
 * A placeholder block standing in for content that has not loaded yet. Size it with `width` and
 * `height`, or with utility classes for anything more involved.
 *
 * It is decorative, so it is hidden from assistive technology. Mark the region it fills with
 * `aria-busy` and describe what is loading there instead.
 */
@Component({
    selector: "mona-skeleton",
    template: ``,
    host: {
        "[attr.aria-hidden]": "'true'",
        "[class]": "baseClass()",
        "[style.height]": "heightString()",
        "[style.width]": "widthString()"
    }
})
export class SkeletonComponent implements SkeletonVariantInput {
    protected readonly baseClass = computed(() => {
        const variantClass = skeletonBaseThemeVariants({ rounded: this.rounded() });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly heightString = computed(() => this.toCssSize(this.height()));
    protected readonly widthString = computed(() => this.toCssSize(this.width()));

    /**
     * @description Height of the placeholder. Numbers are treated as pixels.
     * @default "1rem"
     */
    public readonly height = input<string | number>("1rem");

    /**
     * @description Border-radius preset applied to the placeholder.
     * @default "medium"
     */
    public readonly rounded = input<SkeletonVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    /**
     * @description Width of the placeholder. Numbers are treated as pixels.
     * @default "100%"
     */
    public readonly width = input<string | number>("100%");

    private toCssSize(value: string | number): string {
        return typeof value === "number" ? `${value}px` : value;
    }
}
