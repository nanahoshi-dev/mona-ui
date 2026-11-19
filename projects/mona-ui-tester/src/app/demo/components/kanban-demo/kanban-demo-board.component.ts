import { booleanAttribute, Component, input, signal } from "@angular/core";
import { type KanbanColumn, KanbanComponent } from "@nanahoshi/mona-ui/kanban";
import type { ComponentInputsAsSignal } from "../../utils/componentConfig";

interface Task {
    readonly id: number;
    readonly status: "doing" | "done" | "review" | "todo";
    readonly title: string;
}

/** The playground's board: a release's tasks, with a limit on the In progress column. */
@Component({
    imports: [KanbanComponent],
    template: `
        <mona-kanban
            aria-label="Release tasks"
            [class]="userClass()"
            [columns]="stages"
            [disabled]="disabled()"
            [(data)]="tasks" />
    `
})
export class KanbanDemoBoardComponent implements ComponentInputsAsSignal<KanbanComponent> {
    protected readonly stages: readonly KanbanColumn[] = [
        { status: "todo", title: "To do" },
        { limit: 3, status: "doing", title: "In progress" },
        { status: "review", title: "Review" },
        { status: "done", title: "Done" }
    ];
    protected readonly tasks = signal<Task[]>([
        { id: 1, status: "todo", title: "Write the migration guide" },
        { id: 2, status: "todo", title: "Record the demo video" },
        { id: 3, status: "doing", title: "Fix the date picker in Safari" },
        { id: 4, status: "doing", title: "Update the changelog" },
        { id: 5, status: "review", title: "Add Korean translations" },
        { id: 6, status: "done", title: "Ship the release candidate" },
        { id: 7, status: "todo", title: "Plan the next release" }
    ]);

    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly userClass = input("");
}
