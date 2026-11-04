export interface MonaListBoxMessages {
    readonly clearSelection: string;

    /** Announced after Move Up or Move Down, with the new position of the first moved item ("Moved to position 2 of 5"). */
    itemsMoved(position: number, total: number): string;

    /** Announced after Remove, with the number of items removed. */
    itemsRemoved(count: number): string;

    /** Announced after a transfer, with the number of items moved and the name of the list they moved to. */
    itemsTransferred(count: number, list: string): string;

    /** Announced after a transfer to a list box that has no accessible name. */
    itemsTransferredToOtherList(count: number): string;

    readonly moveDown: string;
    readonly moveUp: string;
    readonly remove: string;

    /** Announced after Clear Selection. */
    readonly selectionCleared: string;

    /** Accessible name of the toolbar, from the list box's name ("Available foods actions"). */
    toolbarLabel(list: string): string;

    /** Label of Transfer All From when the connected list box has no accessible name. */
    readonly transferAllFrom: string;

    /** Label of Transfer All From, naming the connected list box. */
    transferAllFromList(list: string): string;

    /** Label of Transfer All To when the connected list box has no accessible name. */
    readonly transferAllTo: string;

    /** Label of Transfer All To, naming the connected list box. */
    transferAllToList(list: string): string;

    /** Label of Transfer From when the connected list box has no accessible name. */
    readonly transferFrom: string;

    /** Label of Transfer From, naming the connected list box. */
    transferFromList(list: string): string;

    /** Label of Transfer To when the connected list box has no accessible name. */
    readonly transferTo: string;

    /** Label of Transfer To, naming the connected list box. */
    transferToList(list: string): string;
}
