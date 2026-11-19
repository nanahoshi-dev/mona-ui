import { Component, signal } from "@angular/core";
import { BadgeDirective } from "@nanahoshi/mona-ui/badge";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    type KanbanCardMoveEvent,
    type KanbanColumn,
    KanbanCardTemplateDirective,
    KanbanColumnFooterTemplateDirective,
    KanbanComponent
} from "@nanahoshi/mona-ui/kanban";

interface Issue {
    readonly assignee: string;
    readonly id: number;
    readonly priority: "High" | "Low" | "Medium";
    readonly stage: "backlog" | "building" | "shipped" | "testing";
    readonly title: string;
}

@Component({
    selector: "app-kanban-templates-example",
    imports: [
        BadgeDirective,
        ButtonDirective,
        KanbanCardTemplateDirective,
        KanbanColumnFooterTemplateDirective,
        KanbanComponent
    ],
    templateUrl: "./templates-example.component.html"
})
export class KanbanTemplatesExampleComponent {
    #nextId = 7;
    protected readonly columns: readonly KanbanColumn[] = [
        { status: "backlog", title: "Backlog" },
        { limit: 2, status: "building", title: "Building" },
        { limit: 2, status: "testing", title: "Testing" },
        { status: "shipped", title: "Shipped" }
    ];
    protected readonly issues = signal<Issue[]>([
        { assignee: "Ana", id: 1, priority: "High", stage: "backlog", title: "Search ignores accents" },
        { assignee: "Kenji", id: 2, priority: "Low", stage: "backlog", title: "Dark mode logo" },
        { assignee: "Ana", id: 3, priority: "Medium", stage: "building", title: "Export to CSV" },
        { assignee: "Sam", id: 4, priority: "High", stage: "building", title: "Session timeout" },
        { assignee: "Kenji", id: 5, priority: "Medium", stage: "testing", title: "Invite by link" },
        { assignee: "Sam", id: 6, priority: "Low", stage: "shipped", title: "Keyboard shortcuts page" }
    ]);
    protected readonly lastMove = signal("");

    protected add(column: KanbanColumn): void {
        const id = this.#nextId++;
        const stage = column.status as Issue["stage"];
        this.issues.update(issues => [
            ...issues,
            { assignee: "Ana", id, priority: "Medium", stage, title: `Issue ${id}` }
        ]);
    }

    protected onMove(event: KanbanCardMoveEvent<Issue>): void {
        const from = this.titleOf(event.previousStatus);
        const to = this.titleOf(event.status);
        this.lastMove.set(
            from === to
                ? `Reordered "${event.card.title}" in ${to}.`
                : `Moved "${event.card.title}" from ${from} to ${to}.`
        );
    }

    protected priorityLook(priority: Issue["priority"]): "error" | "secondary" | "warning" {
        switch (priority) {
            case "High":
                return "error";
            case "Medium":
                return "warning";
            default:
                return "secondary";
        }
    }

    private titleOf(status: unknown): string {
        return this.columns.find(column => column.status === status)?.title ?? "";
    }
}
