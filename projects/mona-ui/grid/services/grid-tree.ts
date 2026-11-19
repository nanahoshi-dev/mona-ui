import type { Row } from "../models/Row";

/** Where a row sits in a tree grid. */
export interface GridTreeRowInfo {
    /** Whether the row's children are shown; always `false` for a row without children. */
    readonly expanded: boolean;
    /** Whether the row has children that pass the filter. */
    readonly hasChildren: boolean;
    /** The row's depth, from 1 for a root row, as `aria-level` counts it. */
    readonly level: number;
    readonly parentUid: string | null;
    /** The row's place among its shown siblings, from 1. */
    readonly posInSet: number;
    /** How many shown siblings the row has, itself included. */
    readonly setSize: number;
}

/** The rows' parents and children, before filtering and sorting. */
export interface GridTreeStructure {
    /** Each row's children in data order, under the parent's uid; the roots are under `null`. */
    readonly children: ReadonlyMap<string | null, readonly Row[]>;
    readonly parents: ReadonlyMap<string, string | null>;
}

export interface GridTreeView {
    /** Every row that passes the filter, in tree order, whether or not its parents are expanded. */
    readonly allRows: readonly Row[];
    readonly info: ReadonlyMap<string, GridTreeRowInfo>;
    /** The rows shown: those whose parents are all expanded. */
    readonly rows: readonly Row[];
}

export interface GridTreeViewOptions {
    readonly isExpanded: (row: Row) => boolean;
    /** The uids of the rows that match the filter, or `null` without a filter. */
    readonly matches: ReadonlySet<string> | null;
    /** Orders one parent's children. */
    readonly sort: (rows: readonly Row[]) => readonly Row[];
}

/**
 * Links the rows to their parents. A row whose parent isn't among the rows is a root, and so is each row of a cycle,
 * whose parents lead back to itself, so a cycle in the data can't hide rows.
 */
export function buildGridTreeStructure(
    rows: Iterable<Row>,
    getParentUid: (row: Row) => string | null
): GridTreeStructure {
    const rowList = Array.from(rows);
    const known = new Set(rowList.map(row => row.uid));
    const declared = new Map<string, string | null>();
    for (const row of rowList) {
        const parentUid = getParentUid(row);
        declared.set(row.uid, parentUid != null && parentUid !== row.uid && known.has(parentUid) ? parentUid : null);
    }
    const inCycle = findCycleMembers(declared);
    const parents = new Map<string, string | null>();
    const children = new Map<string | null, Row[]>();
    for (const row of rowList) {
        const parentUid = inCycle.has(row.uid) ? null : declared.get(row.uid)!;
        parents.set(row.uid, parentUid);
        const siblings = children.get(parentUid);
        if (siblings == null) {
            children.set(parentUid, [row]);
        } else {
            siblings.push(row);
        }
    }
    return { children, parents };
}

/**
 * The rows of a tree in display order. With a filter, a row shows when it matches or when one of its descendants
 * does, so every match keeps the rows above it.
 */
export function buildGridTreeView(structure: GridTreeStructure, options: GridTreeViewOptions): GridTreeView {
    const included = options.matches == null ? null : withAncestors(options.matches, structure.parents);
    const allRows: Row[] = [];
    const rows: Row[] = [];
    const info = new Map<string, GridTreeRowInfo>();
    const childrenOf = (parentUid: string | null): readonly Row[] => {
        const children = structure.children.get(parentUid) ?? [];
        return included == null ? children : children.filter(child => included.has(child.uid));
    };
    // An explicit stack rather than recursion, so a deep tree can't overflow the call stack.
    const stack: { level: number; row: Row; shown: boolean }[] = [];
    const visit = (parentUid: string | null, level: number, shown: boolean): void => {
        const siblings = options.sort(childrenOf(parentUid));
        // Pushed in reverse so the first sibling comes off the stack first.
        for (let index = siblings.length - 1; index >= 0; index--) {
            const row = siblings[index];
            const hasChildren = childrenOf(row.uid).length > 0;
            info.set(row.uid, {
                expanded: hasChildren && options.isExpanded(row),
                hasChildren,
                level,
                parentUid,
                posInSet: index + 1,
                setSize: siblings.length
            });
            stack.push({ level, row, shown });
        }
    };
    visit(null, 1, true);
    while (stack.length > 0) {
        const { level, row, shown } = stack.pop()!;
        const rowInfo = info.get(row.uid)!;
        allRows.push(row);
        if (shown) {
            rows.push(row);
        }
        if (rowInfo.hasChildren) {
            visit(row.uid, level + 1, shown && rowInfo.expanded);
        }
    }
    return { allRows, info, rows };
}

/** The rows above the given rows, which have to be expanded for them to show. */
export function getGridTreeAncestorUids(uids: Iterable<string>, parents: ReadonlyMap<string, string | null>): string[] {
    const ancestors = new Set<string>();
    for (const uid of uids) {
        for (let parent = parents.get(uid) ?? null; parent != null; parent = parents.get(parent) ?? null) {
            if (ancestors.has(parent)) {
                break;
            }
            ancestors.add(parent);
        }
    }
    return [...ancestors];
}

/** The rows whose parents lead back to themselves, found in one pass over the parent links. */
function findCycleMembers(parents: ReadonlyMap<string, string | null>): Set<string> {
    const members = new Set<string>();
    // 1 while a walk is on the row, 2 once the row's walk is done.
    const state = new Map<string, 1 | 2>();
    for (const start of parents.keys()) {
        const path: string[] = [];
        let uid: string | null = start;
        while (uid != null && !state.has(uid)) {
            state.set(uid, 1);
            path.push(uid);
            uid = parents.get(uid) ?? null;
        }
        // The walk came back to a row of its own path: that row and the ones after it form a cycle.
        if (uid != null && state.get(uid) === 1) {
            for (const member of path.slice(path.indexOf(uid))) {
                members.add(member);
            }
        }
        for (const visited of path) {
            state.set(visited, 2);
        }
    }
    return members;
}

function withAncestors(uids: ReadonlySet<string>, parents: ReadonlyMap<string, string | null>): Set<string> {
    const result = new Set(uids);
    for (const ancestor of getGridTreeAncestorUids(uids, parents)) {
        result.add(ancestor);
    }
    return result;
}
