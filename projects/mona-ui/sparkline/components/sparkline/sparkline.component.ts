import { booleanAttribute, Component, computed, inject, input } from "@angular/core";
import { formatNumber, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { SPARKLINE_DEFAULT_MESSAGES } from "../../i18n/sparkline.default-messages";
import type { SparklineCurve } from "../../models/SparklineCurve";
import type { SparklineMarker } from "../../models/SparklineMarker";
import type { SparklineType } from "../../models/SparklineType";
import {
    SPARKLINE_AREA_CLASSES,
    SPARKLINE_BAR_CLASSES,
    SPARKLINE_BASELINE_CLASSES,
    SPARKLINE_DOT_CLASSES,
    SPARKLINE_LINE_CLASSES,
    SPARKLINE_REFERENCE_CLASSES,
    SPARKLINE_SVG_CLASSES,
    sparklineBaseThemeVariants
} from "../../styles/sparkline.styles";
import { computeSparklineGeometry, getSparklineStats, readSparklineValues } from "../../utils/sparkline-geometry";

/**
 * A word-sized chart of a series of values, to sit on a line of text or in a table cell: a line, an area, columns or
 * wins and losses. It's an image to assistive technology, which reads its name and a summary of its values: how many,
 * the first, the last, the lowest and the highest, or how many wins, losses and draws.
 *
 * Values run from left to right, also in a right-to-left layout, as on a chart's axis.
 */
@Component({
    selector: "mona-sparkline",
    templateUrl: "./sparkline.component.html",
    host: {
        "[attr.aria-describedby]": "describedBy()",
        "[attr.aria-hidden]": "decorative() || null",
        "[attr.aria-label]": "accessibleName()",
        "[attr.role]": "decorative() ? null : 'img'",
        "[class]": "baseClass()",
        "[style.--mona-sparkline-color]": "color() || null",
        "[style.--mona-sparkline-negative-color]": "negativeColor() || null"
    }
})
export class SparklineComponent {
    readonly #i18n = inject(MonaI18nService);
    readonly #messages = this.#i18n.componentMessages("sparkline", SPARKLINE_DEFAULT_MESSAGES);
    readonly #values = computed(() => readSparklineValues(this.data()));

    /** Its name, or without one, the summary of its values. */
    protected readonly accessibleName = computed(() => {
        if (this.decorative()) {
            return null;
        }
        return this.ariaLabel().trim() || this.summary();
    });
    protected readonly areaClass = SPARKLINE_AREA_CLASSES;
    protected readonly barClasses = SPARKLINE_BAR_CLASSES;
    protected readonly baseClass = computed(() => {
        const markers = this.markers().length > 0 && this.type() !== "column" && this.type() !== "win-loss";
        return twMerge(sparklineBaseThemeVariants({ markers }), this.userClass());
    });
    protected readonly baselineClass = SPARKLINE_BASELINE_CLASSES;
    /** With a name, the summary of its values is its description, after any the application gives. */
    protected readonly describedBy = computed(() => {
        if (this.decorative()) {
            return null;
        }
        const ids = [this.ariaDescribedBy().trim(), this.ariaLabel().trim() ? this.descriptionId : ""];
        return ids.filter(id => id.length > 0).join(" ") || null;
    });
    protected readonly descriptionId = createElementControlId();
    protected readonly dotClass = SPARKLINE_DOT_CLASSES;
    protected readonly geometry = computed(() =>
        computeSparklineGeometry(this.#values(), {
            curve: this.curve(),
            markers: this.markers(),
            max: this.max(),
            min: this.min(),
            referenceValue: this.referenceValue(),
            type: this.type()
        })
    );
    protected readonly lineClass = SPARKLINE_LINE_CLASSES;
    protected readonly referenceClass = SPARKLINE_REFERENCE_CLASSES;
    protected readonly showDescription = computed(() => !this.decorative() && this.ariaLabel().trim().length > 0);
    protected readonly summary = computed(() => {
        const messages = this.#messages();
        const stats = getSparklineStats(this.#values());
        if (!stats) {
            return messages.noData;
        }
        if (this.type() === "win-loss") {
            return messages.winLossSummary(stats.wins, stats.losses, stats.draws);
        }
        const locale = this.#i18n.localeId();
        const options = this.format() ?? undefined;
        const format = (value: number): string => formatNumber(value, locale, options);
        return messages.summary(
            stats.count,
            format(stats.first),
            format(stats.last),
            format(stats.min),
            format(stats.max)
        );
    });
    protected readonly svgClass = SPARKLINE_SVG_CLASSES;

    /**
     * @description Ids of elements that describe the sparkline further. The summary of its values is added after them
     * when it has a name.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description The sparkline's name, what its values are, such as "Weekly sales". Assistive technology reads the
     * summary of its values after it. Without a name, the summary is the name.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description The color of the line, the area and the bars, as a CSS color. The first chart color when empty.
     * The `--mona-sparkline-color` custom property sets it from a style sheet.
     * @default ""
     */
    public readonly color = input("");

    /**
     * @description How a line or an area joins its values, as a chart's line series does: `"linear"`, `"monotone-x"`
     * (smooth, never past the values), `"natural"` (smoother, but it can swing past them), `"step"` (changing halfway
     * between values) or `"step-after"` (holding each value until the next). Columns and win-loss bars ignore it.
     * @default "linear"
     */
    public readonly curve = input<SparklineCurve>("linear");

    /**
     * @description The values, in order. A `null`, or anything that isn't a finite number, leaves a gap.
     * @default []
     */
    public readonly data = input<Iterable<number | null | undefined>>([]);

    /**
     * @description Hides the sparkline from assistive technology, for one beside text that already gives its values.
     * @default false
     */
    public readonly decorative = input(false, { transform: booleanAttribute });

    /**
     * @description How the values are formatted in the summary assistive technology reads, such as
     * `{ style: "currency", currency: "EUR" }`. The locale's number format when `null`.
     * @default null
     */
    public readonly format = input<Intl.NumberFormatOptions | null>(null);

    /**
     * @description Values a line or area sparkline marks with a dot: `"first"`, `"last"`, `"min"` and `"max"`.
     * @default []
     */
    public readonly markers = input<readonly SparklineMarker[]>([]);

    /**
     * @description The value at the top of the sparkline. Give several sparklines the same `min` and `max` to compare
     * them. When `null`, the highest value, or zero for columns, or the reference value when it's higher.
     * @default null
     */
    public readonly max = input<number | null>(null);

    /**
     * @description The value at the bottom of the sparkline. When `null`, the lowest value, or zero for columns, or the
     * reference value when it's lower.
     * @default null
     */
    public readonly min = input<number | null>(null);

    /**
     * @description The color of column bars below zero and of losses, as a CSS color. The error color when empty. The
     * `--mona-sparkline-negative-color` custom property sets it from a style sheet.
     * @default ""
     */
    public readonly negativeColor = input("");

    /**
     * @description A value to draw a dashed line at, such as a target or an average. Not drawn on a win-loss
     * sparkline.
     * @default null
     */
    public readonly referenceValue = input<number | null>(null);

    /**
     * @description How the values are drawn: `"line"`, `"area"`, `"column"` or `"win-loss"`.
     * @default "line"
     */
    public readonly type = input<SparklineType>("line");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`, such as a size: it's
     * 6rem wide and 1.5rem tall by default.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
}
