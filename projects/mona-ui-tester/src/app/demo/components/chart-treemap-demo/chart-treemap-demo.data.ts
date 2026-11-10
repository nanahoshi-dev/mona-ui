/** One node of the Treemap playground's budget. A node with children takes its value from them. */
export interface BudgetNode {
    readonly children?: readonly BudgetNode[];
    readonly id: string;
    readonly name: string;
    readonly value?: number;
}

export type BudgetDataSet = "deep" | "empty" | "shallow";

/** The top-level departments. Both data sets have the same ones, so hidden departments stay hidden on a switch. */
export const BUDGET_DEPARTMENTS: readonly { readonly id: string; readonly name: string }[] = [
    { id: "engineering", name: "Engineering" },
    { id: "sales", name: "Sales" },
    { id: "marketing", name: "Marketing" },
    { id: "operations", name: "Operations" },
    { id: "support", name: "Support" }
];

/** Each department's teams and their yearly budget in thousands of dollars. */
const TEAMS: Readonly<Record<string, readonly (readonly [string, number])[]>> = {
    engineering: [
        ["Platform", 1840],
        ["Mobile", 1260],
        ["Web", 1120],
        ["Data", 960],
        ["Security", 540]
    ],
    marketing: [
        ["Growth", 720],
        ["Brand", 640],
        ["Events", 380],
        ["Content", 260]
    ],
    operations: [
        ["Facilities", 520],
        ["People", 460],
        ["Finance", 410],
        ["Legal", 300]
    ],
    sales: [
        ["Enterprise", 1380],
        ["Mid-market", 860],
        ["Partnerships", 420]
    ],
    support: [
        ["Success", 340],
        ["Tier 1", 380],
        ["Tier 2", 290]
    ]
};

/** How a team's budget splits into cost lines in the deep data set. */
const COST_LINES: readonly (readonly [string, number])[] = [
    ["Salaries", 0.7],
    ["Software", 0.14],
    ["Training", 0.1],
    ["Travel", 0.06]
];

/** The platform team's cloud bill, a fourth level that `maxDepth` can collapse. */
const CLOUD_SERVICES: readonly (readonly [string, number])[] = [
    ["Compute", 180],
    ["Storage", 90],
    ["Network", 40]
];

function slug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function costLines(teamId: string, budget: number): BudgetNode[] {
    const lines: BudgetNode[] = COST_LINES.map(([name, share]) => ({
        id: `${teamId}-${slug(name)}`,
        name,
        value: Math.round(budget * share)
    }));
    if (teamId === "engineering-platform") {
        lines.push({
            children: CLOUD_SERVICES.map(([name, value]) => ({ id: `${teamId}-cloud-${slug(name)}`, name, value })),
            id: `${teamId}-cloud`,
            name: "Cloud"
        });
    }
    return lines;
}

function buildBudget(deep: boolean): readonly BudgetNode[] {
    return BUDGET_DEPARTMENTS.map(department => ({
        children: (TEAMS[department.id] ?? []).map(([name, budget]) => {
            const id = `${department.id}-${slug(name)}`;
            return deep ? { children: costLines(id, budget), id, name } : { id, name, value: budget };
        }),
        id: department.id,
        name: department.name
    }));
}

/** Departments and their teams: two levels. */
export const SHALLOW_BUDGET = buildBudget(false);

/** Departments, teams and cost lines, with one team's cloud bill a level further down. */
export const DEEP_BUDGET = buildBudget(true);

export function budgetData(set: BudgetDataSet): readonly BudgetNode[] {
    switch (set) {
        case "deep":
            return DEEP_BUDGET;
        case "empty":
            return [];
        case "shallow":
            return SHALLOW_BUDGET;
    }
}
