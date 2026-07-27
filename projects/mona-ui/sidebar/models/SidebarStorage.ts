/**
 * Where a sidebar remembers whether it was left open. Supplied through `SIDEBAR_STORAGE`, and only
 * ever consulted for a sidebar that was given a `persistKey`.
 *
 * Only the docked state is ever handed to it. A drawer on a compact viewport is deliberately never
 * persisted: restoring one open would cover the page on load, in front of the content the reader
 * asked for.
 */
export interface SidebarStorage {
    /**
     * The remembered state for `key`, or `null` when nothing has been stored under it — including
     * when this storage cannot answer, such as on the server. A `null` leaves the sidebar on whatever
     * its `expanded` input says.
     */
    read(key: string): boolean | null;

    /** Records the docked state for `key`. Failing to store it must not throw. */
    write(key: string, expanded: boolean): void;
}
