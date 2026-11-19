import { LiveAnnouncer } from "@angular/cdk/a11y";
import { type CdkDragDrop, CdkDrag, CdkDropList } from "@angular/cdk/drag-drop";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import axe from "axe-core";
import { KanbanComponent } from "../components/kanban/kanban.component";
import { KanbanCardTemplateDirective } from "../directives/kanban-card-template.directive";
import { KanbanColumnFooterTemplateDirective } from "../directives/kanban-column-footer-template.directive";
import { KanbanColumnHeaderTemplateDirective } from "../directives/kanban-column-header-template.directive";
import type { KanbanCardMoveEvent } from "../models/KanbanCardMoveEvent";
import type { KanbanColumn } from "../models/KanbanColumn";

interface Task {
    readonly id: number;
    readonly name: string;
    readonly state: "doing" | "done" | "review" | "todo";
}

const TASKS: readonly Task[] = [
    { id: 1, name: "Write docs", state: "todo" },
    { id: 2, name: "Fix login", state: "doing" },
    { id: 3, name: "Plan sprint", state: "todo" },
    { id: 4, name: "Ship 1.0", state: "done" }
];

@Component({
    imports: [KanbanComponent],
    template: `
        <mona-kanban
            aria-label="Sprint"
            statusField="state"
            textField="name"
            [columns]="columns()"
            [disabled]="disabled()"
            [(data)]="tasks"
            [dir]="direction()"
            (cardMove)="onMove($event)" />
    `
})
class BoardHostComponent {
    public readonly columns = signal<readonly KanbanColumn[]>([
        { status: "todo", title: "To do" },
        { limit: 2, status: "doing", title: "Doing" },
        { status: "review", title: "Review" },
        { status: "done", title: "Done" }
    ]);
    public readonly direction = signal<"ltr" | "rtl">("ltr");
    public readonly disabled = signal(false);
    public readonly moves: KanbanCardMoveEvent<Task>[] = [];
    public readonly tasks = signal<Task[]>([...TASKS]);
    public refuse = false;

    public onMove(event: KanbanCardMoveEvent<Task>): void {
        this.moves.push(event);
        if (this.refuse) {
            event.preventDefault();
        }
    }
}

@Component({
    imports: [
        KanbanCardTemplateDirective,
        KanbanColumnFooterTemplateDirective,
        KanbanColumnHeaderTemplateDirective,
        KanbanComponent
    ],
    template: `
        <mona-kanban aria-label="Sprint" statusField="state" [columns]="columns" [data]="tasks">
            <ng-template
                monaKanbanCardTemplate
                [monaKanbanCardTemplateOf]="tasks"
                let-task
                let-column="column"
                let-index="index">
                <strong>{{ task.name }}</strong>
                <span class="where">{{ column.title }} #{{ index + 1 }}</span>
            </ng-template>
            <ng-template monaKanbanColumnHeaderTemplate let-column let-count="count">
                <span class="custom-header">{{ column.title }} ({{ count }})</span>
            </ng-template>
            <ng-template monaKanbanColumnFooterTemplate let-column>
                <button type="button">Add to {{ column.title }}</button>
            </ng-template>
        </mona-kanban>
    `
})
class TemplateHostComponent {
    public readonly columns: readonly KanbanColumn[] = [
        { status: "todo", title: "To do" },
        { status: "done", title: "Done" }
    ];
    public readonly tasks: readonly Task[] = TASKS;
}

describe("KanbanComponent", () => {
    let announce: ReturnType<typeof vi.fn>;

    async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(() => {
        announce = vi.fn().mockResolvedValue(undefined);
        TestBed.configureTestingModule({ providers: [{ provide: LiveAnnouncer, useValue: { announce } }] });
    });

    describe("board", () => {
        let fixture: ComponentFixture<BoardHostComponent>;
        let host: BoardHostComponent;
        let root: HTMLElement;

        function columns(): HTMLElement[] {
            return Array.from(root.querySelectorAll<HTMLElement>("mona-kanban > [role='group']"));
        }

        function cardTexts(): string[][] {
            return columns().map(column =>
                Array.from(column.querySelectorAll("li"), card => card.textContent?.trim() ?? "")
            );
        }

        function card(text: string): HTMLElement {
            return Array.from(root.querySelectorAll<HTMLElement>("li")).find(
                element => element.textContent?.trim() === text
            )!;
        }

        async function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
            const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
            target.dispatchEvent(event);
            await settle(fixture);
            return event;
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(BoardHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            document.body.append(root);
            await settle(fixture);
        });

        afterEach(() => {
            fixture.destroy();
            root.remove();
        });

        it("puts each card in its status's column, in the order of the data", () => {
            expect(cardTexts()).toEqual([["Write docs", "Plan sprint"], ["Fix login"], [], ["Ship 1.0"]]);
        });

        it("names each column's group and list by its title and count, with its limit", () => {
            const [todo, doing, review] = columns();
            const name = (element: Element) =>
                element
                    .getAttribute("aria-labelledby")!
                    .split(" ")
                    .map(id => root.querySelector(`#${id}`)!.textContent!.trim())
                    .join(" ");

            expect(name(todo)).toBe("To do 2 cards");
            expect(name(doing)).toBe("Doing 1 of 2 cards");
            expect(name(todo.querySelector("ul")!)).toBe("To do 2 cards");
            expect(
                Array.from(columns(), column => column.querySelector("[aria-hidden='true']")?.textContent?.trim())
            ).toEqual(["2", "1 / 2", "0", "1"]);
            expect(review.querySelector("p")?.textContent?.trim()).toBe("No cards");
            expect(root.querySelector("mona-kanban")!.getAttribute("role")).toBe("group");
        });

        it("gives the board one Tab stop, on the first card", () => {
            const stops = Array.from(root.querySelectorAll("li[tabindex='0']"), element => element.textContent?.trim());

            expect(stops).toEqual(["Write docs"]);
        });

        it("moves focus with the arrow keys, skipping empty columns, mirrored from right to left", async () => {
            card("Write docs").focus();
            await press(card("Write docs"), "ArrowDown");
            expect(document.activeElement).toBe(card("Plan sprint"));

            await press(card("Plan sprint"), "ArrowRight");
            expect(document.activeElement).toBe(card("Fix login"));

            await press(card("Fix login"), "ArrowRight");
            expect(document.activeElement).toBe(card("Ship 1.0"));
            expect(card("Ship 1.0").tabIndex).toBe(0);
            expect(card("Write docs").tabIndex).toBe(-1);

            host.direction.set("rtl");
            await settle(fixture);
            await press(card("Ship 1.0"), "ArrowRight");
            expect(document.activeElement).toBe(card("Fix login"));

            await press(card("Fix login"), "Home");
            expect(document.activeElement).toBe(card("Fix login"));
        });

        it("moves a card to the next column with Control+Shift+ArrowRight, giving it that column's status", async () => {
            card("Write docs").focus();

            await press(card("Write docs"), "ArrowRight", { ctrlKey: true, shiftKey: true });

            // It keeps its row: first in To do, so first in Doing.
            expect(cardTexts()).toEqual([["Plan sprint"], ["Write docs", "Fix login"], [], ["Ship 1.0"]]);
            const moved = host.tasks().find(task => task.id === 1)!;
            expect(moved).toEqual({ id: 1, name: "Write docs", state: "doing" });
            expect(moved).not.toBe(TASKS[0]);
            expect(host.moves[0].card).toBe(TASKS[0]);
            expect(host.moves[0].movedCard).toBe(moved);
            expect([host.moves[0].previousStatus, host.moves[0].status]).toEqual(["todo", "doing"]);
            expect([host.moves[0].previousIndex, host.moves[0].currentIndex]).toEqual([0, 0]);
            expect(document.activeElement).toBe(card("Write docs"));
            expect(card("Write docs").tabIndex).toBe(0);
            expect(announce).toHaveBeenCalledWith("Write docs moved to Doing, position 1 of 2");
        });

        it("reorders a column with Control+Shift+ArrowDown, keeping the card's object", async () => {
            card("Write docs").focus();

            await press(card("Write docs"), "ArrowDown", { ctrlKey: true, shiftKey: true });

            expect(cardTexts()[0]).toEqual(["Plan sprint", "Write docs"]);
            expect(host.tasks().map(task => task.id)).toEqual([2, 3, 1, 4]);
            expect(host.moves[0].movedCard).toBe(TASKS[0]);
            expect(announce).toHaveBeenCalledWith("Write docs moved to position 2 of 2");
        });

        it("passes over a full column, and into an empty one", async () => {
            host.tasks.update(tasks => [...tasks, { id: 5, name: "Review copy", state: "doing" }]);
            await settle(fixture);
            card("Write docs").focus();

            await press(card("Write docs"), "ArrowRight", { ctrlKey: true, shiftKey: true });

            expect(cardTexts()).toEqual([["Plan sprint"], ["Fix login", "Review copy"], ["Write docs"], ["Ship 1.0"]]);
        });

        it("highlights a full column's count, and refuses a drop into it", async () => {
            host.tasks.update(tasks => [...tasks, { id: 5, name: "Review copy", state: "doing" }]);
            await settle(fixture);
            const count = columns()[1].querySelector("[aria-hidden='true']")!;
            expect(count.className).toContain("bg-warning-subtle");

            const lists = fixture.debugElement.queryAll(By.directive(CdkDropList));
            const doing = lists[1].injector.get(CdkDropList);
            const drags = fixture.debugElement
                .queryAll(By.directive(CdkDrag))
                .map(element => element.injector.get(CdkDrag));
            expect(doing.enterPredicate(drags[0], doing)).toBe(false);
        });

        it("applies a pointer drop into another column", async () => {
            const lists = fixture.debugElement
                .queryAll(By.directive(CdkDropList))
                .map(element => element.injector.get(CdkDropList));
            const drags = fixture.debugElement
                .queryAll(By.directive(CdkDrag))
                .map(element => element.injector.get(CdkDrag));

            lists[2].dropped.emit({
                container: lists[2],
                currentIndex: 0,
                event: new MouseEvent("mouseup"),
                item: drags[1],
                previousContainer: lists[0],
                previousIndex: 1
            } as unknown as CdkDragDrop<unknown>);
            await settle(fixture);

            expect(cardTexts()).toEqual([["Write docs"], ["Fix login"], ["Plan sprint"], ["Ship 1.0"]]);
            expect(announce).toHaveBeenCalledWith("Plan sprint moved to Review, position 1 of 1");
        });

        it("keeps the data when the move is refused, or the board is disabled", async () => {
            host.refuse = true;
            card("Write docs").focus();
            await press(card("Write docs"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            expect(host.moves).toHaveLength(1);
            expect(host.tasks()).toEqual(TASKS);
            expect(announce).not.toHaveBeenCalled();

            host.refuse = false;
            host.disabled.set(true);
            await settle(fixture);
            await press(card("Write docs"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            expect(host.moves).toHaveLength(1);
            expect(card("Write docs").hasAttribute("aria-keyshortcuts")).toBe(false);
        });

        it("names the move shortcuts on each card", () => {
            expect(card("Fix login").getAttribute("aria-keyshortcuts")).toBe(
                "Control+Shift+ArrowUp Control+Shift+ArrowDown Control+Shift+Home Control+Shift+End " +
                    "Control+Shift+ArrowLeft Control+Shift+ArrowRight"
            );
        });

        it("passes axe", async () => {
            const results = await axe.run(root, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });

            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    it("renders the card, column header and column footer templates with their contexts", async () => {
        const fixture = TestBed.createComponent(TemplateHostComponent);
        const root = fixture.nativeElement as HTMLElement;
        document.body.append(root);
        await settle(fixture);

        expect(Array.from(root.querySelectorAll(".where"), element => element.textContent?.trim())).toEqual([
            "To do #1",
            "To do #2",
            "Done #1"
        ]);
        expect(Array.from(root.querySelectorAll(".custom-header"), element => element.textContent?.trim())).toEqual([
            "To do (2)",
            "Done (1)"
        ]);
        expect(Array.from(root.querySelectorAll("button"), element => element.textContent?.trim())).toEqual([
            "Add to To do",
            "Add to Done"
        ]);

        const results = await axe.run(root, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });
        expect(results.violations.map(violation => violation.id)).toEqual([]);

        fixture.destroy();
        root.remove();
    });
});
