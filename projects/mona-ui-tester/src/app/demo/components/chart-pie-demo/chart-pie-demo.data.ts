/** One row of the Pie & Donut playground: a traffic channel, its sessions, and a color for `colorField`. */
export interface ChannelShare {
    readonly channel: string;
    readonly color: string;
    readonly sessions: number | null;
}

export type ChannelDataSet = "channels" | "empty" | "many" | "zeros";

/** Five channels, few enough that every slice gets a label. */
export const CHANNELS: readonly ChannelShare[] = [
    { channel: "Organic search", color: "#2563eb", sessions: 4820 },
    { channel: "Direct", color: "#d97706", sessions: 2950 },
    { channel: "Social", color: "#059669", sessions: 1870 },
    { channel: "Referral", color: "#db2777", sessions: 1240 },
    { channel: "Email", color: "#7c3aed", sessions: 860 }
];

/** Ten channels with a long tail of thin slices: the palette repeats, and small labels drop out. */
export const MANY_CHANNELS: readonly ChannelShare[] = [
    ...CHANNELS,
    { channel: "Paid search", color: "#0891b2", sessions: 640 },
    { channel: "Display", color: "#65a30d", sessions: 410 },
    { channel: "Affiliates", color: "#dc2626", sessions: 260 },
    { channel: "Podcasts", color: "#4f46e5", sessions: 140 },
    { channel: "Events", color: "#a16207", sessions: 90 }
];

/** Two rows without a positive value. They draw no slice and get no legend entry, but keep their indices. */
export const CHANNELS_WITH_ZEROS: readonly ChannelShare[] = CHANNELS.map((row, index) =>
    index === 1 ? { ...row, sessions: null } : index === 3 ? { ...row, sessions: 0 } : row
);

export function channelData(set: ChannelDataSet): readonly ChannelShare[] {
    switch (set) {
        case "channels":
            return CHANNELS;
        case "empty":
            return [];
        case "many":
            return MANY_CHANNELS;
        case "zeros":
            return CHANNELS_WITH_ZEROS;
    }
}
