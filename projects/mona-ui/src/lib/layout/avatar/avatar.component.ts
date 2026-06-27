import { ChangeDetectionStrategy, Component, computed, input, Signal } from "@angular/core";

@Component({
    selector: "mona-avatar",
    templateUrl: "./avatar.component.html",
    host: {
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.role]": "ariaLabel() ? 'img' : null",
        "[style]": "avatarStyles()"
    }
})
export class AvatarComponent {
    protected readonly avatarLabelStyles: Signal<Partial<CSSStyleDeclaration>> = computed(() => {
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
    protected readonly avatarStyles: Signal<Partial<CSSStyleDeclaration>> = computed(() => {
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
     * @description Alternative text for the avatar image.
     * @default ""
     */
    public readonly alt = input("");

    /**
     * @description Accessible label for the avatar host element.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Sets the background color of the avatar.
     *
     * If an image is provided, this will be ignored.
     */
    public readonly backgroundColor = input("var(--color-primary)");

    /**
     * @description Sets the border color of the avatar.
     */
    public readonly borderColor = input("var(--color-border)");

    /**
     * @description Sets the border radius of the avatar.
     * Can be a percentage or pixel value.
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
     * @description Sets the border width of the avatar.
     * Can be a pixel value.
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
     * @description Custom styles spread over all computed host styles, taking precedence over every
     * other style input including `display`, `height`, and `width`.
     * Overriding layout-critical properties such as `display` may break expected rendering.
     */
    public readonly customStyles = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Sets the height of the avatar.
     * Can be a pixel value or a string with units (e.g., "64px").
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
     * @description Sets the image URL for the avatar.
     * If an image is provided, the avatar will display the image instead of a label.
     */
    // TODO(owner-review): migrate to NgOptimizedImage once width/height inputs are changed to number-only
    public readonly image = input("");

    /**
     * @description Sets the label for the avatar.
     * If an image is provided, this will be ignored.
     */
    public readonly label = input("");

    /**
     * @description Sets the color of the label text.
     * If an image is provided, this will be ignored.
     */
    public readonly labelColor = input("var(--color-foreground)");

    /**
     * @description Sets the font size of the label text.
     * If an image is provided, this will be ignored.
     */
    public readonly labelFontSize = input("1rem");

    /**
     * @description Sets the font weight of the label text.
     * If an image is provided, this will be ignored.
     */
    public readonly labelFontWeight = input("700");

    /**
     * @description Sets the width of the avatar.
     * Can be a pixel value or a string with units (e.g., "64px").
     */
    public readonly width = input("64px", {
        transform: (value: string | number) => {
            if (typeof value === "string") {
                return value;
            }
            return `${value}px`;
        }
    });
}
