import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragPreview, CdkDragStart, CdkDropList } from "@angular/cdk/drag-drop";
import { LucideGripVertical } from "@lucide/angular";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    signal,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImmutableList } from "@mirei/ts-collections";
import { fromEvent } from "rxjs";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import {
    gridListBaseThemeVariants,
    gridListTableThemeVariants,
    gridRowDragPlaceholderThemeVariants,
    gridRowDragPreviewThemeVariants,
    GridListVariantInput
} from "../../styles/grid.styles";
import { GridAddRowComponent } from "../grid-add-row/grid-add-row.component";
import { GridColgroupComponent } from "../grid-colgroup/grid-colgroup.component";
import { GridDetailRowComponent } from "../grid-detail-row/grid-detail-row.component";
import { GridFooterRowComponent } from "../grid-footer-row/grid-footer-row.component";
import { GridGroupRowComponent } from "../grid-group-row/grid-group-row.component";
import { GridRowComponent } from "../grid-row/grid-row.component";

@Component({
    selector: "mona-grid-list",
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./grid-list.component.html",
    imports: [
        LucideGripVertical,
        GridAddRowComponent,
        GridColgroupComponent,
        GridDetailRowComponent,
        GridFooterRowComponent,
        GridGroupRowComponent,
        GridRowComponent,
        CdkDropList,
        CdkDrag,
        CdkDragPreview
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridListComponent implements GridListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    private readonly bodyTableElementRef = viewChild.required<ElementRef<HTMLTableElement>>("bodyTable");
    protected readonly baseClass = computed(() => {
        return gridListBaseThemeVariants({ virtual: false });
    });
    protected readonly bodyRows = computed(() => this.gridService.createBodyRows(this.data()));
    protected readonly draggedRowHeight = signal<number | null>(null);
    protected readonly gridService = inject(GridService);
    protected readonly rowDragPlaceholderClass = computed(() => {
        return gridRowDragPlaceholderThemeVariants();
    });
    protected readonly rowDragPreviewClass = computed(() => {
        return gridRowDragPreviewThemeVariants();
    });
    protected readonly tableClass = computed(() => {
        return gridListTableThemeVariants();
    });

    public readonly data = input<ImmutableList<Row>>(ImmutableList.create());

    public constructor() {
        afterNextRender({
            read: () => {
                const bodyTableElement = this.bodyTableElementRef().nativeElement;
                const bodyScrollElement = this.#hostElementRef.nativeElement;
                this.gridService.bodyTableElement.set(bodyTableElement);
                this.gridService.bodyScrollElement.set(bodyScrollElement);
                this.setSubscriptions();
                this.#destroyRef.onDestroy(() => {
                    if (this.gridService.bodyTableElement() === bodyTableElement) {
                        this.gridService.bodyTableElement.set(null);
                    }
                    if (this.gridService.bodyScrollElement() === bodyScrollElement) {
                        this.gridService.bodyScrollElement.set(null);
                    }
                });
            }
        });
    }

    public onRowDragEnded(_event: CdkDragEnd<Row>): void {
        this.gridService.draggingRowUid.set(null);
        this.draggedRowHeight.set(null);
    }

    public onRowDragStarted(event: CdkDragStart<Row>): void {
        const height = event.source.getRootElement().getBoundingClientRect().height;
        if (height > 0) {
            this.draggedRowHeight.set(height);
        }
        this.gridService.draggingRowUid.set(event.source.data.uid);
    }

    public onRowDrop(event: CdkDragDrop<Row[]>): void {
        this.gridService.draggingRowUid.set(null);
        this.draggedRowHeight.set(null);
        this.gridService.requestRowReorder(event.item.data, event.previousIndex, event.currentIndex);
    }

    public onRowPointerDown(event: PointerEvent): void {
        // CDK may hide the source before dragStarted. Capture its height before that happens.
        if (this.gridService.rowReorderInteractionEnabled() && event.currentTarget instanceof HTMLElement) {
            this.draggedRowHeight.set(event.currentTarget.getBoundingClientRect().height);
        }
    }

    protected onBodyFocus(): void {
        this.#gridNavigationService.focusActiveCellOrFirstHeader();
    }

    private setSubscriptions(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#gridNavigationService.focusActiveCellOrFirstHeader();
            });
    }
}
