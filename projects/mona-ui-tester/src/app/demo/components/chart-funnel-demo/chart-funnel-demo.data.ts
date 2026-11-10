/** One stage of the Funnel playground. `id` feeds `keyField`, so the stage IDs read as `k:s:<id>`. */
export interface FunnelStage {
    readonly color: string;
    readonly id: string;
    readonly stage: string;
    readonly users: number;
}

export type FunnelDataSet = "empty" | "referral" | "sales" | "signup";

export interface HiddenStagePreset {
    readonly text: string;
    readonly value: readonly string[];
}

/** A product sign-up journey that narrows at every step. */
export const SIGNUP_STAGES: readonly FunnelStage[] = [
    { color: "#1d4ed8", id: "visited", stage: "Visited", users: 12400 },
    { color: "#6d28d9", id: "signed-up", stage: "Signed up", users: 4820 },
    { color: "#be185d", id: "activated", stage: "Activated", users: 3150 },
    { color: "#c2410c", id: "trial", stage: "Started trial", users: 1960 },
    { color: "#15803d", id: "subscribed", stage: "Subscribed", users: 1120 },
    { color: "#0e7490", id: "renewed", stage: "Renewed", users: 860 }
];

/** A sales pipeline in deals. */
export const SALES_STAGES: readonly FunnelStage[] = [
    { color: "#1e3a8a", id: "lead", stage: "Leads", users: 2400 },
    { color: "#1d4ed8", id: "qualified", stage: "Qualified", users: 1250 },
    { color: "#2563eb", id: "proposal", stage: "Proposal", users: 640 },
    { color: "#3b82f6", id: "negotiation", stage: "Negotiation", users: 410 },
    { color: "#15803d", id: "won", stage: "Won", users: 260 }
];

/** A referral flow where invitations bring in more people than were invited, so one stage widens. */
export const REFERRAL_STAGES: readonly FunnelStage[] = [
    { color: "#0e7490", id: "installed", stage: "Installed", users: 5000 },
    { color: "#6d28d9", id: "invited", stage: "Sent an invite", users: 3200 },
    { color: "#be185d", id: "joined", stage: "Friends joined", users: 4100 },
    { color: "#15803d", id: "active", stage: "Active after a week", users: 2300 }
];

export const NO_HIDDEN_STAGES: readonly string[] = [];

const HIDDEN_STAGE_PRESETS: Readonly<Record<FunnelDataSet, readonly HiddenStagePreset[]>> = {
    empty: [{ text: "None", value: NO_HIDDEN_STAGES }],
    referral: presetsFor(REFERRAL_STAGES),
    sales: presetsFor(SALES_STAGES),
    signup: presetsFor(SIGNUP_STAGES)
};

export function funnelData(set: FunnelDataSet): readonly FunnelStage[] {
    switch (set) {
        case "empty":
            return [];
        case "referral":
            return REFERRAL_STAGES;
        case "sales":
            return SALES_STAGES;
        case "signup":
            return SIGNUP_STAGES;
    }
}

/** The `hiddenStageIds` choices of a data set. Each array is created once, so the panel can match it again. */
export function hiddenStagePresets(set: FunnelDataSet): readonly HiddenStagePreset[] {
    return HIDDEN_STAGE_PRESETS[set];
}

function presetsFor(stages: readonly FunnelStage[]): readonly HiddenStagePreset[] {
    const [, second, third] = stages;
    return [
        { text: "None", value: NO_HIDDEN_STAGES },
        { text: `Hide ${second.stage}`, value: [`k:s:${second.id}`] },
        { text: `Hide ${second.stage} and ${third.stage}`, value: [`k:s:${second.id}`, `k:s:${third.id}`] }
    ];
}
