import { booleanAttribute, Component, computed, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import {
    SEPARATOR_LABEL_LINE_CLASSES,
    separatorThemeVariants,
    type SeparatorVariantProps
} from "../../styles/separator.styles";

/**
 * A thin line between groups of content, across a column or down a row, with an optional label in its middle. Like an
 * `<hr>`, it's a separator for assistive technology unless it's marked decorative.
 */
@Component({
    selector: "mona-separator",
    templateUrl: "./separator.component.html",
    host: {
        "[attr.aria-orientation]": "role() === 'separator' && orientation() === 'vertical' ? 'vertical' : null",
        "[attr.role]": "role()",
        "[class]": "baseClass()"
    }
})
export class SeparatorComponent {
    protected readonly baseClass = computed(() =>
        twMerge(
            separatorThemeVariants({
                labelled: this.labelled(),
                orientation: this.labelled() ? "horizontal" : this.orientation()
            }),
            this.userClass()
        )
    );
    protected readonly labelled = computed(() => this.label() !== "");
    protected readonly lineClass = SEPARATOR_LABEL_LINE_CLASSES;
    /** A label is read as text, which a separator's role would hide, so a labelled line has none. */
    protected readonly role = computed(() => (this.decorative() || this.labelled() ? null : "separator"));

    /**
     * @description Marks the line as only visual, so assistive technology skips it. Use it where the line repeats a
     * boundary the content already makes, such as between cards.
     * @default false
     */
    public readonly decorative = input(false, { transform: booleanAttribute });

    /**
     * @description Text in the middle of a horizontal line, such as "or" between two ways to sign in. It's read as text,
     * and the line stays out of the way, as if it were decorative.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description Whether the line runs across (`horizontal`, between stacked content) or down (`vertical`, between
     * items in a row). A vertical line stretches to the row's height. A labelled line is always horizontal.
     * @default "horizontal"
     */
    public readonly orientation = input<NonNullable<SeparatorVariantProps["orientation"]>>("horizontal");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`, such as a margin.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
