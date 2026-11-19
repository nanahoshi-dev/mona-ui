import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    GridColumnComponent,
    GridComponent,
    GridSortableDirective,
    GridToolbarTemplateDirective,
    GridTreeDirective
} from "@nanahoshi/mona-ui/grid";

interface Task {
    readonly hours: number;
    readonly id: number;
    readonly name: string;
    readonly owner: string;
    readonly subtasks?: readonly Task[];
}

@Component({
    selector: "app-grid-tree-tasks-example",
    imports: [
        ButtonDirective,
        GridColumnComponent,
        GridComponent,
        GridSortableDirective,
        GridToolbarTemplateDirective,
        GridTreeDirective
    ],
    templateUrl: "./tasks-example.component.html"
})
export class GridTreeTasksExampleComponent {
    protected readonly expandedIds = signal<unknown[]>([1]);
    protected readonly tasks: readonly Task[] = [
        {
            id: 1,
            name: "Website relaunch",
            owner: "Amara Okafor",
            hours: 120,
            subtasks: [
                {
                    id: 2,
                    name: "Design",
                    owner: "Mei Tanaka",
                    hours: 40,
                    subtasks: [
                        { id: 3, name: "Wireframes", owner: "Mei Tanaka", hours: 16 },
                        { id: 4, name: "Visual design", owner: "Sofia Rossi", hours: 24 }
                    ]
                },
                {
                    id: 5,
                    name: "Build",
                    owner: "Lukas Weber",
                    hours: 64,
                    subtasks: [
                        { id: 6, name: "Templates", owner: "Lukas Weber", hours: 40 },
                        { id: 7, name: "Content migration", owner: "Noah Clarke", hours: 24 }
                    ]
                },
                { id: 8, name: "Launch review", owner: "Amara Okafor", hours: 16 }
            ]
        },
        {
            id: 9,
            name: "Mobile app",
            owner: "Diego Ramos",
            hours: 90,
            subtasks: [
                { id: 10, name: "User research", owner: "Sofia Rossi", hours: 30 },
                { id: 11, name: "Prototype", owner: "Mei Tanaka", hours: 60 }
            ]
        },
        { id: 12, name: "Quarterly report", owner: "Noah Clarke", hours: 12 }
    ];
}
