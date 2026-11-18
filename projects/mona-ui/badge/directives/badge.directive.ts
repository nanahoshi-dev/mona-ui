import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { type BadgeVariantInputs, type BadgeVariantProps, badgeThemeVariants } from "../styles/badge.styles";

/**
 * @description
 * A short count or status, such as `12` or `Draft`, drawn as a small filled or outlined label. It adds no role, so its text
 * reads as part of what's around it.
 */
@Directive({
    selector: "[monaBadge]",
    host: {
        "[class]": "baseClass()"
    }
})
export class BadgeDirective implements BadgeVariantInputs {
    protected readonly baseClass = computed(() =>
        twMerge(
            badgeThemeVariants({
                fill: this.fill(),
                look: this.look(),
                rounded: this.rounded(),
                size: this.size()
            }),
            this.userClass()
        )
    );

    /**
     * @description How the badge is drawn: `solid` fills it with the look's color, `subtle` with a light tint of it, and
     * `outline` draws only its border.
     * @default "solid"
     */
    public readonly fill = input<BadgeVariantProps["fill"]>("solid");

    /**
     * @description The badge's color role. Pick it for what the badge means, such as `error` for a failed state, and say
     * that in its text too, since color alone doesn't reach everyone.
     * @default "secondary"
     */
    public readonly look = input<BadgeVariantProps["look"]>("secondary");

    /**
     * @description Border-radius preset. `full` makes a pill, and a round dot for a single digit.
     * @default "medium"
     */
    public readonly rounded = input<BadgeVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the badge's height, padding, text and icon size.
     * @default "medium"
     */
    public readonly size = input<BadgeVariantProps["size"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
