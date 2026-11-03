import { InjectionToken, type InputSignal, type OutputEmitterRef, type Signal } from "@angular/core";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";

export interface DropdownPopupInput {
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

export const DROPDOWN_POPUP_INPUT_TOKEN = new InjectionToken<DropdownPopupInput>("DROPDOWN_POPUP_INPUT");
