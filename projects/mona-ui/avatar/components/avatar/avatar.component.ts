import { Component, computed, input } from "@angular/core";

@Component({
    selector: "mona-avatar",
    templateUrl: "./avatar.component.html",
    host: {
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.role]": "ariaLabel() && !image() ? 'img' : null",
        "[class]": "userClass()",
        "[style]": "avatarStyles()"
    }
})
export class AvatarComponent {
    protected readonly avatarLabelStyles = computed(() => {
        return {
            alignItems: "center",
            color: this.labelColor(),
            display: "flex",
            fontSize: this.labelFontSize(),
            fontWeight: this.labelFontWeight(),
            height: "100%",
            justifyContent: "center",
            width: "100%"
        };
    });
    protected readonly avatarStyles = computed(() => {
        const image = this.image();
        const backgroundColor = image ? "transparent" : this.backgroundColor();
        return {
            borderColor: this.borderColor(),
            borderWidth: this.borderWidth(),
            borderStyle: "solid",
            borderRadius: this.borderRadius(),
            backgroundColor,
            display: "inline-block",
            height: this.height(),
            width: this.width(),
            ...this.customStyles()
        };
    });

    /**
     * @description Alternative text for the avatar image. Provide a meaningful description for non-decorative images;
     * an empty string marks the image as decorative.
     * @default ""
     */
    public readonly alt = input("");

    /**
     * @description Accessible name for the host element. Describe what the avatar represents.
     * When non-empty, the host receives `role="img"` in label and projected-content modes.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Background color of the host element.
     * Ignored in image mode — the background is set to transparent automatically.
     * @default "var(--color-primary)"
     */
    public readonly backgroundColor = input("var(--color-primary)");

    /**
     * @description Border color of the host element.
     * @default "var(--color-border)"
     */
    public readonly borderColor = input("var(--color-border)");

    /**
     * @description Border radius of the host element. Accepts a CSS string (`'50%'`, `'8px'`) or a number converted to `px`.
     * In image mode, the image is also clipped to this radius.
     * @default "0"
     */
    public readonly borderRadius = input("0", {
        transform: (value: string | number) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });

    /**
     * @description Border width of the host element. Accepts a CSS string or a number converted to `px`.
     * @default "1px"
     */
    public readonly borderWidth = input("1px", {
        transform: (value: string | number) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });

    /**
     * @description Inline styles applied after all other style inputs,
     * taking precedence over every computed style including `display`, `height`, and `width`.
     * @default {}
     */
    public readonly customStyles = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Height of the host element. A string is used as-is; a number is converted to `px`.
     * @default "64px"
     */
    public readonly height = input("64px", {
        transform: (value: string | number) => {
            if (typeof value === "string") {
                return value;
            }
            return `${value}px`;
        }
    });

    /**
     * @description Image URL. When non-empty, renders an `<img>` and suppresses `label` and projected content.
     * @default ""
     */
    // TODO(owner-review): migrate to NgOptimizedImage once width/height inputs are changed to number-only
    public readonly image = input("");

    /**
     * @description Text label displayed inside the avatar when no image is provided. Ignored when `image` is non-empty.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description Color of the label text. Ignored in image mode.
     * @default "var(--color-foreground)"
     */
    public readonly labelColor = input("var(--color-foreground)");

    /**
     * @description Font size of the label text. Ignored in image mode.
     * @default "1rem"
     */
    public readonly labelFontSize = input("1rem");

    /**
     * @description Font weight of the label text. Ignored in image mode.
     * @default "700"
     */
    public readonly labelFontWeight = input("700");

    /**
     * @description Width of the host element. A string is used as-is; a number is converted to `px`.
     * @default "64px"
     */
    public readonly width = input("64px", {
        transform: (value: string | number) => {
            if (typeof value === "string") {
                return value;
            }
            return `${value}px`;
        }
    });

    /**
     * @description Additional CSS classes applied to the host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
}
