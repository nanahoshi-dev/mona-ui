import { CdkScrollable } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import {
    booleanAttribute,
    Component,
    computed,
    contentChild,
    ElementRef,
    inject,
    input,
    output,
    signal,
    TemplateRef
} from "@angular/core";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import {
    type SortableMoveEvent,
    SortableDirective,
    SortableGroupDirective,
    SortableItemDirective
} from "@nanahoshi/mona-ui/sortable";
import { twMerge } from "tailwind-merge";
import { KanbanCardTemplateDirective } from "../../directives/kanban-card-template.directive";
import { KanbanColumnFooterTemplateDirective } from "../../directives/kanban-column-footer-template.directive";
import { KanbanColumnHeaderTemplateDirective } from "../../directives/kanban-column-header-template.directive";
import { KANBAN_DEFAULT_MESSAGES } from "../../i18n/kanban.default-messages";
import { KanbanCardMoveEvent } from "../../models/KanbanCardMoveEvent";
import type { KanbanColumn } from "../../models/KanbanColumn";
import type { KanbanCardTemplateContext, KanbanColumnTemplateContext } from "../../models/KanbanTemplateContext";
import {
    kanbanBaseThemeVariants,
    kanbanCardThemeVariants,
    kanbanColumnBodyThemeVariants,
    kanbanColumnCountThemeVariants,
    kanbanColumnEmptyThemeVariants,
    kanbanColumnFooterThemeVariants,
    kanbanColumnHeaderThemeVariants,
    kanbanColumnListThemeVariants,
    kanbanColumnThemeVariants,
    kanbanColumnTitleThemeVariants
} from "../../styles/kanban.styles";

/** A card's place on the board: its column's index, and its index in the column. */
interface CardPosition {
    readonly column: number;
    readonly index: number;
}

function readField(card: object, field: string): unknown {
    return (card as Record<string, unknown>)[field];
}

/**
 * @description
 * A board of columns that cards move between, by dragging or with Control+Shift and the arrow keys (Command+Shift on
 * macOS). Each card goes in the column whose `status` its status field holds, in the order of `data`. A move emits
 * `cardMove`, then the new data through `dataChange`, so bind `[(data)]`. The arrow keys move focus between cards.
 */
@Component({
    selector: "mona-kanban",
    templateUrl: "./kanban.component.html",
    imports: [NgTemplateOutlet, SortableDirective, SortableItemDirective],
    // The board scrolls sideways, so a card dragged to its edge scrolls it; and it connects its columns' lists.
    hostDirectives: [CdkScrollable, SortableGroupDirective],
    host: {
        role: "group",
        "[class]": "baseClass()"
    }
})
export class KanbanComponent<T extends object = Record<string, unknown>> {
    readonly #direction = injectComponentDirection();
    readonly #focused = signal<CardPosition | null>(null);
    readonly #hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    /** The card that holds the board's Tab stop: the one last focused, else the first card. */
    protected readonly activeCard = computed<CardPosition | null>(() => {
        const columns = this.columnCards();
        const focused = this.#focused();
        if (focused != null && columns[focused.column]?.[focused.index] !== undefined) {
            return focused;
        }
        const column = columns.findIndex(cards => cards.length > 0);
        return column < 0 ? null : { column, index: 0 };
    });
    protected readonly baseClass = computed(() => twMerge(kanbanBaseThemeVariants(), this.userClass()));
    protected readonly bodyClass = kanbanColumnBodyThemeVariants();
    protected readonly cardClass = kanbanCardThemeVariants();
    protected readonly cardTemplate = contentChild(KanbanCardTemplateDirective, { read: TemplateRef });
    /** Each column's cards, in the order of `data`. */
    protected readonly columnCards = computed(() => {
        const field = this.statusField();
        const data = this.data();
        return this.columns().map(column => data.filter(card => readField(card, field) === column.status));
    });
    protected readonly columnClass = kanbanColumnThemeVariants();
    protected readonly columnFooterTemplate = contentChild(KanbanColumnFooterTemplateDirective, { read: TemplateRef });
    protected readonly columnHeaderTemplate = contentChild(KanbanColumnHeaderTemplateDirective, { read: TemplateRef });
    protected readonly emptyClass = kanbanColumnEmptyThemeVariants();
    /** Whether each column takes a card from another column: always, or while it's under its limit. */
    protected readonly enterChecks = computed(() =>
        this.columns().map((column, index) => () => {
            const limit = column.limit;
            return limit == null || this.columnCards()[index].length < limit;
        })
    );
    protected readonly footerClass = kanbanColumnFooterThemeVariants();
    protected readonly headerClass = kanbanColumnHeaderThemeVariants();
    protected readonly id = createElementControlId();
    protected readonly listClass = kanbanColumnListThemeVariants();
    protected readonly messages = inject(MonaI18nService).componentMessages("kanban", KANBAN_DEFAULT_MESSAGES);
    protected readonly titleClass = kanbanColumnTitleThemeVariants();

    /**
     * @description Emitted with a {@link KanbanCardMoveEvent} when a card moves within its column or into another,
     * before `dataChange`. This event is preventable.
     */
    public readonly cardMove = output<KanbanCardMoveEvent<T>>();

    /**
     * @description The board's columns, in order. A card whose status matches no column isn't shown.
     */
    public readonly columns = input.required<readonly KanbanColumn[]>();

    /**
     * @description The cards. Each goes in the column whose `status` its status field holds, in the order of this
     * array. Bind it two-way, `[(data)]`, to take each move.
     */
    public readonly data = input.required<readonly T[]>();

    /**
     * @description Emitted with the board's new cards after a move, unless the move was refused. A card that changes
     * column is a copy with its status field set to the column's status.
     */
    public readonly dataChange = output<T[]>();

    /**
     * @description Stops cards from moving, by pointer or keyboard. Focus still moves between them, and what their
     * template holds still works.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description The field of each card that holds its column's `status`.
     * @default "status"
     */
    public readonly statusField = input("status");

    /**
     * @description The field of each card shown as its text when there's no card template, and used as its name in
     * announcements of its moves.
     * @default "title"
     */
    public readonly textField = input("title");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    protected cardContext(card: T, column: KanbanColumn, index: number): KanbanCardTemplateContext<T> {
        return { $implicit: card, column, index };
    }

    protected cardText(card: T): string {
        const text = readField(card, this.textField());
        return text == null ? "" : String(text);
    }

    protected columnContext(column: KanbanColumn, cards: readonly T[]): KanbanColumnTemplateContext<T> {
        return { $implicit: column, cards, count: cards.length };
    }

    /** The count as the header shows it: "3", or "3 / 5" for a column with a limit. */
    protected countBadge(count: number, column: KanbanColumn): string {
        return column.limit == null ? String(count) : `${count} / ${column.limit}`;
    }

    protected countClass(count: number, column: KanbanColumn): string {
        return kanbanColumnCountThemeVariants({ full: column.limit != null && count >= column.limit });
    }

    protected countText(count: number, column: KanbanColumn): string {
        const messages = this.messages();
        return column.limit == null ? messages.cardCount(count) : messages.cardCountWithLimit(count, column.limit);
    }

    protected onCardFocus(column: number, index: number): void {
        this.#focused.set({ column, index });
    }

    /** Arrow keys move focus: Up and Down within a column, Left and Right to the next column with cards. */
    protected onCardKeydown(event: KeyboardEvent, column: number, index: number): void {
        if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }
        const columns = this.columnCards();
        const last = columns[column].length - 1;
        let target: CardPosition | null;
        switch (event.key) {
            case "ArrowUp":
                target = { column, index: Math.max(index - 1, 0) };
                break;
            case "ArrowDown":
                target = { column, index: Math.min(index + 1, last) };
                break;
            case "Home":
                target = { column, index: 0 };
                break;
            case "End":
                target = { column, index: last };
                break;
            case "ArrowLeft":
            case "ArrowRight": {
                const forward = (event.key === "ArrowRight") !== (this.#direction() === "rtl");
                target = this.findAdjacentColumn(columns, column, index, forward ? 1 : -1);
                break;
            }
            default:
                return;
        }
        event.preventDefault();
        if (target != null) {
            this.focusCard(target);
        }
    }

    /** Turns a list's move into the board's new data: the card in its new place, with its new status. */
    protected onCardMove(event: SortableMoveEvent<T>, columnIndex: number): void {
        const column = this.columns()[columnIndex];
        const field = this.statusField();
        const card = event.item;
        const previousStatus = readField(card, field);
        const movedCard = previousStatus === column.status ? card : ({ ...card, [field]: column.status } as T);
        const data = this.data().filter(candidate => candidate !== card);
        const columnCards = data.filter(candidate => readField(candidate, field) === column.status);
        const next = columnCards[event.currentIndex];
        if (next !== undefined) {
            data.splice(data.indexOf(next), 0, movedCard);
        } else if (columnCards.length > 0) {
            data.splice(data.indexOf(columnCards[columnCards.length - 1]) + 1, 0, movedCard);
        } else {
            data.push(movedCard);
        }
        const moveEvent = new KanbanCardMoveEvent<T>(
            {
                card,
                currentIndex: event.currentIndex,
                data,
                movedCard,
                previousIndex: event.previousIndex,
                previousStatus,
                status: column.status
            },
            event.originalEvent
        );
        this.cardMove.emit(moveEvent);
        if (moveEvent.isDefaultPrevented()) {
            event.preventDefault();
            return;
        }
        this.dataChange.emit(data);
    }

    private findAdjacentColumn(
        columns: readonly (readonly T[])[],
        from: number,
        index: number,
        step: 1 | -1
    ): CardPosition | null {
        for (let column = from + step; column >= 0 && column < columns.length; column += step) {
            if (columns[column].length > 0) {
                return { column, index: Math.min(index, columns[column].length - 1) };
            }
        }
        return null;
    }

    private focusCard(position: CardPosition): void {
        const card = this.#hostElement.querySelector<HTMLElement>(
            `[data-kanban-card="${position.column}-${position.index}"]`
        );
        card?.focus();
    }
}
