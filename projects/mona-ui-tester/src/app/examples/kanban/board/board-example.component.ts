import { Component, signal } from "@angular/core";
import { type KanbanColumn, KanbanComponent } from "@nanahoshi/mona-ui/kanban";

interface Task {
    readonly id: number;
    readonly status: "doing" | "done" | "todo";
    readonly title: string;
}

@Component({
    selector: "app-kanban-board-example",
    imports: [KanbanComponent],
    templateUrl: "./board-example.component.html"
})
export class KanbanBoardExampleComponent {
    protected readonly columns: readonly KanbanColumn[] = [
        { status: "todo", title: "To do" },
        { status: "doing", title: "In progress" },
        { status: "done", title: "Done" }
    ];
    protected readonly tasks = signal<Task[]>([
        { id: 1, status: "todo", title: "Draft the newsletter" },
        { id: 2, status: "todo", title: "Book the venue" },
        { id: 3, status: "doing", title: "Design the poster" },
        { id: 4, status: "done", title: "Pick a date" }
    ]);
}
