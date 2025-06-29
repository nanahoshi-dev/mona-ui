import { NgStyle } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, Signal } from "@angular/core";

@Component({
    selector: "mona-avatar",
    templateUrl: "./avatar.component.html",
    styleUrls: ["./avatar.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgStyle],
    host: {
        class: "mona-avatar block",
        "[style]": "avatarStyles()"
    }
})
export class AvatarComponent {
    protected readonly avatarLabelStyles: Signal<Partial<CSSStyleDeclaration>> = computed(() => {
        return {
            color: this.labelColor(),
            fontSize: this.labelFontSize(),
            fontWeight: this.labelFontWeight()
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
            height: this.height(),
            width: this.width(),
            ...this.customStyles()
        };
    });

    /**
     * @description Sets the background color of the avatar.
     *
     * If an image is provided, this will be ignored.
     */
    public backgroundColor = input("var(--mona-primary)");

    /**
     * @description Sets the border color of the avatar.
     */
    public borderColor = input("var(--mona-border-color)");

    /**
     * @description Sets the border radius of the avatar.
     * Can be a percentage or pixel value.
     */
    public borderRadius = input("0", {
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
    public borderWidth = input("1px", {
        transform: (value: string | number) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });

    /**
     * @description Custom styles to apply to the avatar.
     * This can be used to override default styles or add additional styles.
     */
    public customStyles = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Sets the height of the avatar.
     * Can be a pixel value or a string with units (e.g., "64px").
     */
    public height = input("64px", {
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
    public image = input("");

    /**
     * @description Sets the label for the avatar.
     * If an image is provided, this will be ignored.
     */
    public label = input("");

    /**
     * @description Sets the color of the label text.
     * If an image is provided, this will be ignored.
     */
    public labelColor = input("var(--mona-text)");

    /**
     * @description Sets the font size of the label text.
     * If an image is provided, this will be ignored.
     */
    public labelFontSize = input("1rem");

    /**
     * @description Sets the font weight of the label text.
     * If an image is provided, this will be ignored.
     */
    public labelFontWeight = input("700");

    /**
     * @description Sets the width of the avatar.
     * Can be a pixel value or a string with units (e.g., "64px").
     */
    public width = input("64px", {
        transform: (value: string | number) => {
            if (typeof value === "string") {
                return value;
            }
            return `${value}px`;
        }
    });
}
