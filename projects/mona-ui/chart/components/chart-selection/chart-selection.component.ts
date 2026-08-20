import { Component, DestroyRef, effect, inject, input, OnInit, output } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type {
    ChartSelectionChangeEvent,
    ChartSelectionMode
} from "../../models/chart-selection.models";

@Component({
    selector: "mona-chart-selection",
    template: "",
    host: {
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartSelectionComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);

    /**
     * @description Whether selection interaction is enabled.
     * @default true
     */
    public readonly enabled = input(true);

    /**
     * @description Selection mode ('single' or 'multiple').
     * @default "single"
     */
    public readonly mode = input<ChartSelectionMode>("single");

    /**
     * @description Controlled selected mark IDs. When defined, component acts as controlled state.
     * @default undefined
     */
    public readonly selectedMarkIds = input<readonly string[] | undefined>(undefined);

    /**
     * @description Default selected mark IDs to seed initial uncontrolled selection.
     * @default []
     */
    public readonly defaultSelectedMarkIds = input<readonly string[]>([]);

    /**
     * @description Whether clicking marks selects/toggles them.
     * @default true
     */
    public readonly clickSelection = input(true);

    /**
     * @description Whether keyboard Enter / Space on focused marks selects/toggles them.
     * @default true
     */
    public readonly keyboardSelection = input(true);

    /**
     * @description Whether clicking plot background clears active selection.
     * @default true
     */
    public readonly clearOnBackgroundClick = input(true);

    /**
     * @description Whether selected mark IDs are retained across dataset changes.
     * @default true
     */
    public readonly retainOnDataChange = input(true);

    /**
     * @description Selection highlight stroke color override.
     * @default undefined
     */
    public readonly color = input<string | undefined>(undefined);

    /**
     * @description Selection highlight stroke width override.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Selection highlight fill opacity override.
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Emitted when mark selection is proposed or changed.
     */
    public readonly selectionChange = output<ChartSelectionChangeEvent>();

    #registered = false;

    public constructor() {
        effect(() => {
            this.enabled();
            this.mode();
            this.selectedMarkIds();
            this.defaultSelectedMarkIds();
            this.clickSelection();
            this.keyboardSelection();
            this.clearOnBackgroundClick();
            this.retainOnDataChange();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Interaction);
            }
        });

        effect(() => {
            this.color();
            this.strokeWidth();
            this.fillOpacity();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        this.#registered = true;

        const unregister = this.#chartContext.registerSelection({
            clearOnBackgroundClick: this.clearOnBackgroundClick,
            clickSelection: this.clickSelection,
            color: this.color,
            defaultSelectedMarkIds: this.defaultSelectedMarkIds,
            emitSelectionChange: event => this.selectionChange.emit(event),
            enabled: this.enabled,
            fillOpacity: this.fillOpacity,
            keyboardSelection: this.keyboardSelection,
            mode: this.mode,
            retainOnDataChange: this.retainOnDataChange,
            selectedMarkIds: this.selectedMarkIds,
            strokeWidth: this.strokeWidth
        });

        this.#destroyRef.onDestroy(() => {
            unregister();
        });
    }
}
