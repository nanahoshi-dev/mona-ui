import { InjectionToken, type InputSignal, type OutputEmitterRef, type Signal } from "@angular/core";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { AdaptiveMode } from "./AdaptiveMode";

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export interface DropdownPopupInput {
    /** Whether the popup opens as a bottom sheet on a small screen. Dropdowns without the input never do. */
    readonly adaptiveMode?: InputSignal<AdaptiveMode>;
    /** The bottom sheet's title; the field's name when empty. */
    readonly adaptiveTitle?: InputSignal<string>;
    readonly close: OutputEmitterRef<PopupCloseEvent>;
    readonly closed: OutputEmitterRef<void>;
    readonly disabled: Signal<boolean>;
    readonly open: OutputEmitterRef<PreventableEvent>;
    readonly opened: OutputEmitterRef<void>;
    readonly popupHeight: InputSignal<ListSizeInputType>;
    readonly popupWidth: InputSignal<ListSizeInputType>;
    readonly readonly: Signal<boolean>;
    readonly touch: OutputEmitterRef<void>;
}

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export const DROPDOWN_POPUP_INPUT_TOKEN = new InjectionToken<DropdownPopupInput>("DROPDOWN_POPUP_INPUT");
