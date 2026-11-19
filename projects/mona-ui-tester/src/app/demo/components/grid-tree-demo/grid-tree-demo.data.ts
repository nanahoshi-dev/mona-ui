export interface TreeTask {
    readonly hours: number;
    readonly id: number;
    readonly name: string;
    readonly owner: string;
    /** The parent task's id, for the flat data; `null` for a project. */
    readonly parentId: number | null;
    /** The child tasks, for the nested data. */
    readonly subtasks?: readonly TreeTask[];
}

/** How the data gives the tree: items holding their children, or one list naming each item's parent. */
export type TreeShape = "flat" | "nested";

const TASKS: readonly Omit<TreeTask, "subtasks">[] = [
    { id: 1, parentId: null, name: "Website relaunch", owner: "Amara Okafor", hours: 168 },
    { id: 2, parentId: 1, name: "Design", owner: "Mei Tanaka", hours: 56 },
    { id: 3, parentId: 2, name: "Wireframes", owner: "Mei Tanaka", hours: 16 },
    { id: 4, parentId: 2, name: "Visual design", owner: "Sofia Rossi", hours: 32 },
    { id: 5, parentId: 2, name: "Design review", owner: "Amara Okafor", hours: 8 },
    { id: 6, parentId: 1, name: "Build", owner: "Lukas Weber", hours: 96 },
    { id: 7, parentId: 6, name: "Templates", owner: "Lukas Weber", hours: 48 },
    { id: 8, parentId: 6, name: "Content migration", owner: "Noah Clarke", hours: 32 },
    { id: 9, parentId: 6, name: "Accessibility audit", owner: "Priya Nair", hours: 16 },
    { id: 10, parentId: 1, name: "Launch", owner: "Amara Okafor", hours: 16 },
    { id: 11, parentId: null, name: "Mobile app", owner: "Diego Ramos", hours: 130 },
    { id: 12, parentId: 11, name: "User research", owner: "Sofia Rossi", hours: 30 },
    { id: 13, parentId: 11, name: "Prototype", owner: "Mei Tanaka", hours: 60 },
    { id: 14, parentId: 11, name: "Usability tests", owner: "Sofia Rossi", hours: 40 },
    { id: 15, parentId: null, name: "Quarterly report", owner: "Noah Clarke", hours: 24 },
    { id: 16, parentId: 15, name: "Collect figures", owner: "Jonas Berg", hours: 16 },
    { id: 17, parentId: 15, name: "Write summary", owner: "Noah Clarke", hours: 8 },
    { id: 18, parentId: null, name: "Office move", owner: "Lucas Martin", hours: 12 }
];

/** The same tasks on every run, as a flat list or nested, so the playground and its tests see the same rows. */
export function treeTasks(shape: TreeShape): readonly TreeTask[] {
    if (shape === "flat") {
        return TASKS;
    }
    const nest = (parentId: number | null): TreeTask[] =>
        TASKS.filter(task => task.parentId === parentId).map(task => {
            const subtasks = nest(task.id);
            return subtasks.length === 0 ? task : { ...task, subtasks };
        });
    return nest(null);
}
