import { ConnectionPositionPair } from "@angular/cdk/overlay";
import { Injectable, signal, type TemplateRef } from "@angular/core";
import { Subject } from "rxjs";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import type { PopupRef } from "@nanahoshi/mona-ui/popup";
import type { PopupSettings } from "@nanahoshi/mona-ui/popup";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";

/**
 * @hidden
 * The state one dropdown shares with its popup handlers and live region. Each dropdown provides its own; the date and
 * time pickers use it too, which is why it is exported. Applications don't need it.
 */
@Injectable()
export class DropdownService {
    /**
     * Every key the dropdown's host receives (outside IME composition), before the dropdown handles it. Call
     * `preventDefault()` on the event to skip the built-in handling.
     */
    public readonly beforeKeydown$ = new Subject<PreventableEvent<KeyboardEvent>>();
    /**
     * ArrowDown or ArrowUp on the host, before the dropdown opens, closes or moves through the list. Call
     * `preventDefault()` on the event to skip the built-in handling.
     */
    public readonly beforeNavigate$ = new Subject<PreventableEvent<KeyboardEvent>>();

    /**
     * Set when the popup finishes closing: whether focus may return to the dropdown. It is `false` when the user
     * moved focus outside the dropdown and its popup first, for example by clicking another field or pressing
     * Tab. Read it from `popupCloseComplete$` before calling `focus()`.
     */
    public readonly focusCanReturn = signal(true);
    /**
     * Keys the dropdown has no built-in handling for, and Enter before it toggles the popup. Calling `preventDefault()`
     * on an Enter key stops the toggle.
     */
    public readonly keydown$ = new Subject<KeyboardEvent>();
    /**
     * Emits when the popup has closed and its leave animation has finished, with the close event. By then
     * `popupRef` is `null` and {@link focusCanReturn} is set.
     */
    public readonly popupCloseComplete$ = new Subject<PopupCloseEvent>();
    /** Emits when the popup's close sequence starts, before its leave animation, with the close event. */
    public readonly popupCloseStart$ = new Subject<PopupCloseEvent>();
    /** Emits on the next task after the popup is created, together with the host's `opened` event. */
    public readonly popupOpenComplete$ = new Subject<void>();
    /** The open popup, or `null` while it is closed. */
    public readonly popupRef = signal<PopupRef | null>(null);
    /** The template rendered as the popup's content. Each dropdown component sets it to its own popup template. */
    public readonly popupTemplate = signal<TemplateRef<unknown> | null>(null);
    /**
     * Whether focus returns to the dropdown when the popup closes, passed to the popup as its `restoreFocus` setting.
     * The auto-complete sets it to `false`.
     */
    public readonly restoreFocus = signal<boolean | "auto">("auto");
    /**
     * Opens the popup with the given settings when it is closed. Does nothing while the host is disabled or read-only,
     * or when the `open` event is prevented.
     */
    public readonly triggerPopupOpen$ = new Subject<Partial<PopupSettings>>();
    /** Closes the popup when it is open, and otherwise opens it as {@link triggerPopupOpen$} does. */
    public readonly triggerPopupToggle$ = new Subject<Partial<PopupSettings>>();

    public static getDefaultPositions(): ConnectionPositionPair[] {
        return [
            new ConnectionPositionPair(
                { originX: "start", originY: "bottom" },
                { overlayX: "start", overlayY: "top" },
                -1,
                0,
                "mona-dropdown-popup-content-bottom"
            ),
            new ConnectionPositionPair(
                { originX: "start", originY: "top" },
                { overlayX: "start", overlayY: "bottom" },
                -1,
                -1,
                "mona-dropdown-popup-content-top"
            )
        ];
    }
}
