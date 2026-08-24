import { Injectable } from "@angular/core";
import type { NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";
import type {
    ChartSynchronizationCrosshairClearMessage,
    ChartSynchronizationCrosshairMessage,
    ChartSynchronizationMember,
    ChartSynchronizationPublishCrosshairPayload,
    ChartSynchronizationPublishViewportPayload,
    ChartSynchronizationRegistration,
    ChartSynchronizationViewportMessage,
    SynchronizationGroupState
} from "./chart-synchronization-types";
import { ChartSynchronizationScheduler } from "./chart-synchronization-scheduler";
import { ChartSynchronizationTracker } from "../layout/chart-density-instrumentation";

interface CoordinatorEntry {
    groupId: string;
    readonly member: ChartSynchronizationMember;
}

let synchronizationMemberCounter = 0;
let synchronizationGroupSessionCounter = 0;

@Injectable({ providedIn: "root" })
export class ChartSynchronizationCoordinator {
    readonly #entriesByMemberId = new Map<string, CoordinatorEntry>();
    readonly #groups = new Map<string, SynchronizationGroupState>();
    readonly #lastDeliveredSequence = new Map<string, number>();
    readonly #scheduler = new ChartSynchronizationScheduler(() => {
        ChartSynchronizationTracker.current?.onSyncMessageCoalesced?.();
    });

    public get groupCount(): number {
        return this.#groups.size;
    }

    public getGroupForTesting(groupName: string): SynchronizationGroupState | undefined {
        return this.#groups.get(groupName);
    }

    public getGroupSessionId(groupName: string): number | null {
        const group = this.#groups.get(groupName);
        return group ? group.groupSessionId : null;
    }

    public register(member: ChartSynchronizationMember, initialGroup: string | null): ChartSynchronizationRegistration {
        const memberId = member.memberId || `sync-member-${++synchronizationMemberCounter}`;
        const entry: CoordinatorEntry = { groupId: "", member: { ...member, memberId } };
        this.#entriesByMemberId.set(memberId, entry);
        if (initialGroup) {
            this.#joinGroup(entry, initialGroup);
        }

        return {
            memberId,
            clearCrosshair: () => {
                this.#clearCrosshair(memberId);
            },
            destroy: () => {
                this.#unregister(memberId);
            },
            publishCrosshair: (payload: ChartSynchronizationPublishCrosshairPayload) => {
                this.#publishCrosshair(memberId, payload);
            },
            publishViewport: (payload: ChartSynchronizationPublishViewportPayload) => {
                this.#publishViewport(memberId, payload);
            },
            updateOptions: (options: NormalizedChartSynchronizationOptions | null) => {
                const current = this.#entriesByMemberId.get(memberId);
                if (!current) {
                    return;
                }
                const nextGroup = options?.group ?? null;
                const crosshairEnabled = options?.crosshair.enabled ?? false;
                if (!crosshairEnabled) {
                    this.retireOutgoingCrosshair(memberId);
                }
                if (nextGroup === current.groupId) {
                    return;
                }
                this.retireOutgoingCrosshair(memberId);
                if (current.groupId) {
                    this.#scheduler.cancelOriginGroup(memberId, current.groupId);
                    this.#scheduler.cancelByRecipient(memberId);
                }
                this.#leaveGroup(current);
                current.groupId = "";
                if (nextGroup) {
                    this.#joinGroup(current, nextGroup);
                }
            }
        };
    }

    public retireOutgoingCrosshair(memberId: string): void {
        const entry = this.#entriesByMemberId.get(memberId);
        if (!entry || !entry.groupId) {
            return;
        }
        const group = this.#groups.get(entry.groupId);
        if (!group) {
            return;
        }
        if (group.activeCrosshairOrigin !== memberId) {
            return;
        }
        group.activeCrosshairOrigin = null;
        this.#scheduler.cancelOriginGroup(memberId, entry.groupId, "crosshair");
        const message: ChartSynchronizationCrosshairClearMessage = {
            group: entry.groupId,
            groupSessionId: group.groupSessionId,
            kind: "crosshair-clear",
            originMemberId: memberId,
            sequence: ++group.sequence,
            transactionId: `clear-${memberId}-${group.sequence}`
        };
        this.#deliverToGroupPeers(group, entry.groupId, memberId, message, member => member.clearCrosshair(message));
    }

    #joinGroup(entry: CoordinatorEntry, groupName: string): void {
        let group = this.#groups.get(groupName);
        if (!group) {
            group = {
                activeCrosshairOrigin: null,
                groupSessionId: ++synchronizationGroupSessionCounter,
                members: new Map(),
                sequence: 0
            };
            this.#groups.set(groupName, group);
        }
        group.members.set(entry.member.memberId, entry.member);
        entry.groupId = groupName;
    }

    #leaveGroup(entry: CoordinatorEntry): void {
        if (!entry.groupId) {
            return;
        }
        const group = this.#groups.get(entry.groupId);
        if (group) {
            group.members.delete(entry.member.memberId);
            if (group.activeCrosshairOrigin === entry.member.memberId) {
                group.activeCrosshairOrigin = null;
            }
            if (group.members.size === 0) {
                this.#groups.delete(entry.groupId);
            }
        }
        entry.groupId = "";
    }

    #unregister(memberId: string): void {
        const entry = this.#entriesByMemberId.get(memberId);
        if (!entry) {
            return;
        }
        this.retireOutgoingCrosshair(memberId);
        this.#scheduler.cancelByOrigin(memberId);
        this.#scheduler.cancelByRecipient(memberId);
        this.#leaveGroup(entry);
        this.#entriesByMemberId.delete(memberId);
    }

    #clearCrosshair(originMemberId: string): void {
        const entry = this.#entriesByMemberId.get(originMemberId);
        if (!entry || !entry.groupId) {
            return;
        }
        const group = this.#groups.get(entry.groupId);
        if (!group) {
            return;
        }
        if (group.activeCrosshairOrigin !== null && group.activeCrosshairOrigin !== originMemberId) {
            return;
        }
        group.activeCrosshairOrigin = null;
        this.#scheduler.cancelOriginGroup(originMemberId, entry.groupId, "crosshair");

        const message: ChartSynchronizationCrosshairClearMessage = {
            group: entry.groupId,
            groupSessionId: group.groupSessionId,
            kind: "crosshair-clear",
            originMemberId,
            sequence: ++group.sequence,
            transactionId: `clear-${originMemberId}-${group.sequence}`
        };
        this.#deliverToGroupPeers(group, entry.groupId, originMemberId, message, member =>
            member.clearCrosshair(message)
        );
    }

    #publishCrosshair(originMemberId: string, payload: ChartSynchronizationPublishCrosshairPayload): void {
        const entry = this.#entriesByMemberId.get(originMemberId);
        if (!entry || !entry.groupId) {
            return;
        }
        const group = this.#groups.get(entry.groupId);
        if (!group) {
            return;
        }
        group.activeCrosshairOrigin = originMemberId;

        const message: ChartSynchronizationCrosshairMessage = {
            axes: payload.axes,
            group: entry.groupId,
            groupSessionId: group.groupSessionId,
            kind: "crosshair",
            originMemberId,
            sequence: ++group.sequence,
            snapped: payload.snapped,
            transactionId: payload.transactionId ?? `crosshair-${originMemberId}-${group.sequence}`
        };
        ChartSynchronizationTracker.current?.onSyncMessagePublished?.("crosshair");
        this.#scheduleGroupDelivery(group, entry.groupId, originMemberId, "crosshair", message.sequence, member =>
            member.receiveCrosshair(message)
        );
    }

    #publishViewport(originMemberId: string, payload: ChartSynchronizationPublishViewportPayload): void {
        const entry = this.#entriesByMemberId.get(originMemberId);
        if (!entry || !entry.groupId) {
            return;
        }
        const group = this.#groups.get(entry.groupId);
        if (!group) {
            return;
        }

        const message: ChartSynchronizationViewportMessage = {
            axes: payload.axes,
            group: entry.groupId,
            groupSessionId: group.groupSessionId,
            kind: "viewport",
            originMemberId,
            phase: payload.phase,
            sequence: ++group.sequence,
            source: payload.source,
            transactionId: payload.transactionId ?? `viewport-${originMemberId}-${group.sequence}`
        };
        ChartSynchronizationTracker.current?.onSyncMessagePublished?.("viewport");

        if (payload.phase === "end") {
            this.#scheduler.cancelOriginGroup(originMemberId, entry.groupId, "viewport");
            this.#deliverToGroupPeers(group, entry.groupId, originMemberId, message, member => {
                this.#scheduler.cancelRecipientGroup(member.memberId, entry.groupId, "viewport");
                member.receiveViewport(message);
            });
            return;
        }

        this.#scheduleGroupDelivery(group, entry.groupId, originMemberId, "viewport", message.sequence, member =>
            member.receiveViewport(message)
        );
    }

    #deliverToGroupPeers(
        group: SynchronizationGroupState,
        groupName: string,
        originMemberId: string,
        message:
            | ChartSynchronizationViewportMessage
            | ChartSynchronizationCrosshairMessage
            | ChartSynchronizationCrosshairClearMessage,
        invoke: (member: ChartSynchronizationMember) => void
    ): void {
        const channel = message.kind === "viewport" ? "viewport" : "crosshair";
        const recipients = [...group.members.values()];
        for (const member of recipients) {
            if (member.memberId === originMemberId) {
                continue;
            }
            const currentGroup = this.#entriesByMemberId.get(member.memberId)?.groupId;
            if (currentGroup !== groupName) {
                continue;
            }
            const seqKey = `${group.groupSessionId}:${member.memberId}:${channel}`;
            const lastSeq = this.#lastDeliveredSequence.get(seqKey) ?? 0;
            if (message.sequence <= lastSeq) {
                continue;
            }
            this.#lastDeliveredSequence.set(seqKey, message.sequence);
            ChartSynchronizationTracker.current?.onSyncMessageDelivered?.();
            invoke(member);
        }
    }

    #scheduleGroupDelivery(
        group: SynchronizationGroupState,
        groupName: string,
        originMemberId: string,
        channel: "crosshair" | "viewport",
        sequence: number,
        buildInvoke: (member: ChartSynchronizationMember) => void
    ): void {
        const recipients = [...group.members.values()];
        const groupSessionId = group.groupSessionId;
        for (const member of recipients) {
            if (member.memberId === originMemberId) {
                continue;
            }
            const recipientMemberId = member.memberId;
            this.#scheduler.schedule({
                channel,
                deliver: () => {
                    const originEntry = this.#entriesByMemberId.get(originMemberId);
                    if (!originEntry || originEntry.groupId !== groupName) {
                        return;
                    }
                    const currentEntry = this.#entriesByMemberId.get(recipientMemberId);
                    if (!currentEntry || currentEntry.groupId !== groupName) {
                        return;
                    }
                    const currentGroup = this.#groups.get(groupName);
                    if (!currentGroup || currentGroup.groupSessionId !== groupSessionId) {
                        return;
                    }
                    const seqKey = `${groupSessionId}:${recipientMemberId}:${channel}`;
                    const lastSeq = this.#lastDeliveredSequence.get(seqKey) ?? 0;
                    if (sequence <= lastSeq) {
                        return;
                    }
                    this.#lastDeliveredSequence.set(seqKey, sequence);
                    ChartSynchronizationTracker.current?.onSyncMessageDelivered?.();
                    buildInvoke(currentEntry.member);
                },
                group: groupName,
                kind: channel,
                originMemberId,
                recipientMemberId,
                sequence
            });
        }
    }
}
