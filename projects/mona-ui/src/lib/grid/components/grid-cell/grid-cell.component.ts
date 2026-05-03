import { A11yModule, FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    signal,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormRecord, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
    gridCellBaseThemeVariants,
    gridCellContainerThemeVariants,
    gridCellTextThemeVariants
} from "../../styles/grid.styles";
import { filter, fromEvent, Subject, take, takeUntil, tap, timer } from "rxjs";
import { DatePickerComponent } from "../../../date-inputs/date-picker/components/date-picker/date-picker.component";
import { CheckBoxComponent } from "../../../inputs/check-box/components/check-box/check-box.component";
import { NumericTextBoxComponent } from "../../../inputs/numeric-text-box/components/numeric-text-box/numeric-text-box.component";
import { TextBoxComponent } from "../../../inputs/text-box/components/text-box/text-box.component";
import { ThemeService } from "../../../theme/services/theme.service";
import { TooltipComponent } from "../../../tooltips/tooltip/components/tooltip/tooltip.component";
import { CellEditEvent } from "../../models/CellEditEvent";
import { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";

@Component({
    selector: "mona-grid-cell",
    templateUrl: "./grid-cell.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        A11yModule,
        NgTemplateOutlet,
        FormsModule,
        ReactiveFormsModule,
        TextBoxComponent,
        NumericTextBoxComponent,
        DatePickerComponent,
        TooltipComponent,
        CheckBoxComponent
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #formReset$ = new Subject<void>();
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #injector = inject(Injector);
    readonly #themeService = inject(ThemeService);
    readonly #focused = signal(false);

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellBaseThemeVariants(theme)();
    });
    protected readonly cellContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const editing = this.editing();
        return gridCellContainerThemeVariants(theme)({ editing });
    });
    protected readonly cellTextClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellTextThemeVariants(theme)();
    });
    protected readonly editing = signal(false);
    protected readonly gridService = inject(GridService);
    protected editForm = new FormRecord<FormControl>({});

    /**
     * @description The column configuration for this cell.
     */
    public column = input.required<Column>();

    /**
     * @description The row data for this cell.
     */
    public row = input.required<Row>();

    public constructor() {
        this.setClickSubscription();
        this.setDoubleClickSubscription();
        this.setKeydownSubscription();

        effect(() => {
            const row = this.row();
            const column = this.column();
            untracked(() => this.initializeForm(row, column));
        });
    }

    public onFocusChange(origin: FocusOrigin): void {
        if (!origin) {
            this.handleFocusLoss();
        } else {
            this.handleFocusGain(origin);
        }
    }

    private enterEditMode(): void {
        this.editForm.patchValue({ [this.column().field()]: this.row().data[this.column().field()] });
        this.editing.set(true);
        this.gridService.isInEditMode.set(true);
        afterNextRender(
            () => this.focusCellInput(),
            { injector: this.#injector }
        );
    }

    private focus(): void {
        this.#focusMonitor.focusVia(this.#hostElementRef.nativeElement.firstElementChild as HTMLElement, "program");
    }

    private focusCellInput(): void {
        if (
            this.column().dataType() === "string" ||
            this.column().dataType() === "number" ||
            this.column().dataType() === "date" ||
            this.column().dataType() === "boolean"
        ) {
            this.#hostElementRef.nativeElement.querySelector("input")?.focus();
        }
    }

    private focusCellByCoords(rowUid: string, colIndex: number): void {
        const row = this.#document.querySelector(`tr[data-ruid='${rowUid}']`);
        if (!row) {
            return;
        }
        const cell = row.querySelector(
            `[data-col-index='${colIndex}']`
        ) as HTMLElement;
        cell?.focus();
    }

    private handleArrowDownKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        const nextRowElement = this.#document.querySelector(`tr[data-ruid='${this.row().uid}']`)?.nextElementSibling;
        if (nextRowElement) {
            const cell = nextRowElement.querySelector(
                `[data-field='${this.column().field()}']`
            ) as HTMLElement;
            cell?.focus();
        }
    }

    private handleArrowLeftKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        if (this.column().index() > 0) {
            const row = this.#document.querySelector(`tr[data-ruid='${this.row().uid}']`);
            if (row) {
                const cell = row.querySelector(
                    `[data-col-index='${this.column().index() - 1}']`
                ) as HTMLElement;
                cell?.focus();
            }
        }
    }

    private handleArrowRightKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        if (this.column().index() < this.gridService.columns().length - 1) {
            const row = this.#document.querySelector(`tr[data-ruid='${this.row().uid}']`);
            if (row) {
                const cell = row.querySelector(
                    `[data-col-index='${this.column().index() + 1}']`
                ) as HTMLElement;
                cell?.focus();
            }
        }
    }

    private handleArrowUpKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        const previousRowElement = this.#document.querySelector(
            `tr[data-ruid='${this.row().uid}']`
        )?.previousElementSibling;
        if (previousRowElement) {
            const cell = previousRowElement.querySelector(
                `[data-field='${this.column().field()}']`
            ) as HTMLElement;
            cell?.focus();
        }
    }

    private handleDateInputFocusLoss(): void {
        const popupElement = this.#document.querySelector(".mona-date-input-popup");
        if (popupElement && popupElement.contains(this.#document.activeElement)) {
            return;
        }
        this.editing.set(false);
        this.gridService.isInEditMode.set(false);
        this.updateCellValue();
    }

    private handleEndKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        const lastColIndex = this.gridService.columns().length - 1;
        if (event.ctrlKey || event.metaKey) {
            // Ctrl+End: focus last cell of last row
            const allRows = this.#document.querySelectorAll("tr[data-ruid]");
            const lastRow = allRows[allRows.length - 1];
            if (lastRow) {
                const cell = lastRow.querySelector(
                    `[data-col-index='${lastColIndex}']`
                ) as HTMLElement;
                cell?.focus();
            }
        } else {
            // End: focus last cell of current row
            this.focusCellByCoords(this.row().uid, lastColIndex);
        }
    }

    private handleEnterKey(): void {
        if (!this.editing()) {
            if (this.gridEditable) {
                this.enterEditMode();
            }
            return;
        }
        this.updateCellValue();
        this.editing.set(false);
        this.gridService.isInEditMode.set(false);
        this.focus();
    }

    private handleEscapeKey(): void {
        this.editing.set(false);
        this.gridService.isInEditMode.set(false);
        this.focus();
    }

    private handleF2Key(event: KeyboardEvent): void {
        event.preventDefault();
        if (!this.gridEditable || !this.#focused() || this.editing()) {
            return;
        }
        this.enterEditMode();
    }

    private handleFocusGain(origin: FocusOrigin): void {
        this.#focused.set(true);
        if (this.gridService.isInEditMode() && origin !== "mouse" && this.gridEditable && !this.editing()) {
            this.enterEditMode();
        }
    }

    private handleFocusLoss(): void {
        // Use a short delay to allow the new focus target to be resolved.
        // Date pickers require a slightly longer delay because their popup
        // panel appears asynchronously and focus may still be transitioning.
        const duration = this.column().dataType() === "date" ? 50 : 25;
        timer(duration)
            .pipe(take(1))
            .subscribe(() => {
                if (!this.gridEditable || !this.editing()) {
                    return;
                }
                if (this.column().dataType() !== "date") {
                    this.editing.set(false);
                    this.updateCellValue();
                    // Only reset the global edit mode flag if focus has left the
                    // grid entirely. When focus moves to another cell within the
                    // same grid, keep the flag so the new cell's click handler
                    // can detect the ongoing edit session and auto-enter edit mode.
                    const gridElement = this.#hostElementRef.nativeElement.closest("mona-grid");
                    const focusStillInGrid = gridElement?.contains(this.#document.activeElement);
                    if (!focusStillInGrid) {
                        this.gridService.isInEditMode.set(false);
                    }
                } else {
                    this.handleDateInputFocusLoss();
                }
            });
        this.#focused.set(false);
    }

    private handleHomeKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
            // Ctrl+Home: focus first cell of first row
            const allRows = this.#document.querySelectorAll("tr[data-ruid]");
            const firstRow = allRows[0];
            if (firstRow) {
                const cell = firstRow.querySelector(
                    `[data-col-index='0']`
                ) as HTMLElement;
                cell?.focus();
            }
        } else {
            // Home: focus first cell of current row
            this.focusCellByCoords(this.row().uid, 0);
        }
    }

    private handlePageDownKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        const pageState = this.gridService.pageState;
        const totalRows = this.gridService.viewRowCount();
        const currentSkip = pageState.skip();
        const currentTake = pageState.take();

        if (this.gridService.virtualScrollOptions().enabled) {
            // Virtual scroll: scroll down by visible area height
            const viewport = this.#hostElementRef.nativeElement.closest("mona-grid")
                ?.querySelector("cdk-virtual-scroll-viewport") as HTMLElement;
            if (viewport) {
                viewport.scrollBy({ top: viewport.clientHeight, behavior: "smooth" });
            }
        } else if (currentSkip + currentTake < totalRows) {
            // Paging: go to next page
            const newSkip = currentSkip + currentTake;
            const newPage = Math.floor(newSkip / currentTake) + 1;
            pageState.skip.set(newSkip);
            pageState.page.set(newPage);
        }
    }

    private handlePageUpKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        const pageState = this.gridService.pageState;
        const currentSkip = pageState.skip();
        const currentTake = pageState.take();

        if (this.gridService.virtualScrollOptions().enabled) {
            // Virtual scroll: scroll up by visible area height
            const viewport = this.#hostElementRef.nativeElement.closest("mona-grid")
                ?.querySelector("cdk-virtual-scroll-viewport") as HTMLElement;
            if (viewport) {
                viewport.scrollBy({ top: -viewport.clientHeight, behavior: "smooth" });
            }
        } else if (currentSkip > 0) {
            // Paging: go to previous page
            const newSkip = Math.max(0, currentSkip - currentTake);
            const newPage = Math.floor(newSkip / currentTake) + 1;
            pageState.skip.set(newSkip);
            pageState.page.set(newPage);
        }
    }

    private handleSpaceKey(event: KeyboardEvent): void {
        if (this.editing()) {
            return;
        }
        event.preventDefault();
        if (this.gridService.isSelectableGrid()) {
            const row = this.row();
            if (this.gridService.isRowSelected(row)) {
                this.gridService.selectedKeys.update(set => set.remove(this.getRowSelectionKey(row)));
            } else {
                this.gridService.selectRow(row);
            }
            this.gridService.selectedRowsChange$.next(this.gridService.selectedRows());
        }
    }

    private handleTabKey(): void {
        if (!this.editing()) {
            return;
        }
        this.updateCellValue();
        this.editing.set(false);
    }

    private getRowSelectionKey(row: Row): unknown {
        const selectBy = this.gridService.selectBy();
        if (!selectBy) {
            return row.data;
        }
        if (typeof selectBy === "string") {
            return row.data[selectBy];
        }
        return selectBy(row.data);
    }

    private initializeForm(row: Row, column: Column): void {
        this.#formReset$.next();
        this.editForm = new FormRecord<FormControl>({
            [column.field()]: new FormControl(row.data[column.field()] ?? null)
        });
        if (column.dataType() === "date") {
            this.editForm.controls[column.field()].valueChanges
                .pipe(takeUntil(this.#formReset$), takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => {
                    this.editing.set(false);
                    this.gridService.isInEditMode.set(false);
                });
        }
    }

    private notifyCellEdit(): CellEditEvent {
        const event = new CellEditEvent({
            field: this.column().field(),
            oldValue: this.row().data[this.column().field()],
            newValue: this.editForm.value[this.column().field()] as unknown,
            rowData: this.row().data,
            setNewValue: (value: unknown) => {
                this.editForm.get(this.column().field())?.setValue(value);
                this.row().data[this.column().field()] = value;
            }
        });
        if (event.oldValue !== event.newValue) {
            this.gridService.cellEdit$.next(event);
        }
        return event;
    }

    private setClickSubscription(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                if (!this.editing() && this.gridService.isInEditMode()) {
                    if (this.gridEditable) {
                        this.enterEditMode();
                    } else {
                        this.gridService.isInEditMode.set(false);
                    }
                }
            });
    }

    private setDoubleClickSubscription(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "dblclick")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(event => event.stopPropagation())
            )
            .subscribe(() => {
                if (!this.gridEditable) {
                    return;
                }
                this.enterEditMode();
            });
    }

    private setKeydownSubscription(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(event => event.stopPropagation()),
                filter(
                    event =>
                        event.key === "Enter" ||
                        event.key === "Escape" ||
                        event.key === "Tab" ||
                        event.key === "ArrowUp" ||
                        event.key === "ArrowDown" ||
                        event.key === "ArrowLeft" ||
                        event.key === "ArrowRight" ||
                        event.key === "F2" ||
                        event.key === "Home" ||
                        event.key === "End" ||
                        event.key === "PageUp" ||
                        event.key === "PageDown" ||
                        event.key === " "
                )
            )
            .subscribe(event => {
                switch (event.key) {
                    case "Enter":
                        this.handleEnterKey();
                        break;
                    case "Escape":
                        this.handleEscapeKey();
                        break;
                    case "Tab":
                        this.handleTabKey();
                        break;
                    case "ArrowUp":
                        this.handleArrowUpKey(event);
                        break;
                    case "ArrowDown":
                        this.handleArrowDownKey(event);
                        break;
                    case "ArrowLeft":
                        this.handleArrowLeftKey(event);
                        break;
                    case "ArrowRight":
                        this.handleArrowRightKey(event);
                        break;
                    case "F2":
                        this.handleF2Key(event);
                        break;
                    case "Home":
                        this.handleHomeKey(event);
                        break;
                    case "End":
                        this.handleEndKey(event);
                        break;
                    case "PageUp":
                        this.handlePageUpKey(event);
                        break;
                    case "PageDown":
                        this.handlePageDownKey(event);
                        break;
                    case " ":
                        this.handleSpaceKey(event);
                        break;
                }
            });
    }

    private updateCellValue(): void {
        const event = this.notifyCellEdit();
        if (!event.isDefaultPrevented()) {
            this.row().data[this.column().field()] = this.editForm.value[this.column().field()] as unknown;
            return;
        }
        this.editForm.patchValue({
            [this.column().field()]: this.row().data[this.column().field()]
        });
    }

    private get gridEditable(): boolean {
        return (
            !!this.gridService.editableOptions && !!this.gridService.editableOptions.enabled && this.column().editable()
        );
    }
}
