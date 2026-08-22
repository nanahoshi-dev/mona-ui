import { Injectable } from "@angular/core";
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

@Injectable({ providedIn: "root" })
export class ChartSynchronizationCoordinator {
    readonly #entriesByMemberId = new Map<string, CoordinatorEntry>();
    readonly #groups = new Map<string, SynchronizationGroupState>();
    readonly #scheduler = new ChartSynchronizationScheduler(() => {
        ChartSynchronizationTracker.current?.onSyncMessageCoalesced?.();
    });

    public get groupCount(): number {
        return this.#groups.size;
    }

    public getGroupForTesting(groupName: string): SynchronizationGroupState | undefined {
        return this.#groups.get(groupName);
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
            updateOptions: (options: { group: string } | null) => {
                const current = this.#entriesByMemberId.get(memberId);
                if (!current) {
                    return;
                }
                const nextGroup = options?.group ?? null;
                if (nextGroup === current.groupId) {
                    return;
                }
                this.#leaveGroup(current);
                current.groupId = "";
                if (nextGroup) {
                    this.#joinGroup(current, nextGroup);
                }
            }
        };
    }

    #joinGroup(entry: CoordinatorEntry, groupName: string): void {
        let group = this.#groups.get(groupName);
        if (!group) {
            group = { activeCrosshairOrigin: null, members: new Map(), sequence: 0 };
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
        this.#scheduler.cancel(`${memberId}:crosshair`);
        this.#scheduler.cancel(`${memberId}:viewport`);
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

        const message: ChartSynchronizationCrosshairClearMessage = {
            group: entry.groupId,
            kind: "crosshair-clear",
            originMemberId,
            sequence: ++group.sequence,
            transactionId: `clear-${originMemberId}-${group.sequence}`
        };
        this.#deliverToGroupPeers(group, entry.groupId, originMemberId, member => member.clearCrosshair(message));
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
            kind: "crosshair",
            originMemberId,
            sequence: ++group.sequence,
            snapped: payload.snapped,
            transactionId: payload.transactionId ?? `crosshair-${originMemberId}-${group.sequence}`
        };
        ChartSynchronizationTracker.current?.onSyncMessagePublished?.("crosshair");
        this.#scheduleGroupDelivery(
            group,
            entry.groupId,
            originMemberId,
            "crosshair",
            member => member.receiveCrosshair(message)
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
            kind: "viewport",
            originMemberId,
            phase: payload.phase,
            sequence: ++group.sequence,
            source: payload.source,
            transactionId: payload.transactionId ?? `viewport-${originMemberId}-${group.sequence}`
        };
        ChartSynchronizationTracker.current?.onSyncMessagePublished?.("viewport");

        if (payload.phase === "end") {
            for (const memberId of group.members.keys()) {
                if (memberId !== originMemberId) {
                    this.#scheduler.cancel(`${memberId}:viewport`);
                }
            }
            this.#deliverToGroupPeers(group, entry.groupId, originMemberId, member => member.receiveViewport(message));
            return;
        }

        this.#scheduleGroupDelivery(
            group,
            entry.groupId,
            originMemberId,
            "viewport",
            member => member.receiveViewport(message)
        );
    }

    #deliverToGroupPeers(
        group: SynchronizationGroupState,
        groupName: string,
        originMemberId: string,
        invoke: (member: ChartSynchronizationMember) => void
    ): void {
        const recipients = [...group.members.values()];
        for (const member of recipients) {
            if (member.memberId === originMemberId) {
                continue;
            }
            const currentGroup = this.#entriesByMemberId.get(member.memberId)?.groupId;
            if (currentGroup !== groupName) {
                continue;
            }
            ChartSynchronizationTracker.current?.onSyncMessageDelivered?.();
            invoke(member);
        }
    }

    #scheduleGroupDelivery(
        group: SynchronizationGroupState,
        groupName: string,
        originMemberId: string,
        kind: "crosshair" | "viewport",
        buildInvoke: (member: ChartSynchronizationMember) => void
    ): void {
        const recipients = [...group.members.values()];
        for (const member of recipients) {
            if (member.memberId === originMemberId) {
                continue;
            }
            const memberId = member.memberId;
            this.#scheduler.schedule(`${memberId}:${kind}`, kind, () => {
                const currentEntry = this.#entriesByMemberId.get(memberId);
                if (!currentEntry || currentEntry.groupId !== groupName) {
                    return;
                }
                ChartSynchronizationTracker.current?.onSyncMessageDelivered?.();
                buildInvoke(currentEntry.member);
            });
        }
    }
}
