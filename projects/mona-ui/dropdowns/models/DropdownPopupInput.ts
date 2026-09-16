import { InjectionToken, InputSignal, OutputEmitterRef } from "@angular/core";
import { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export interface DropdownPopupInput {
    readonly close: OutputEmitterRef<PopupCloseEvent>;
    readonly closed: OutputEmitterRef<void>;
    readonly disabled: InputSignal<boolean>;
    readonly open: OutputEmitterRef<PreventableEvent>;
    readonly opened: OutputEmitterRef<void>;
    readonly popupHeight: InputSignal<ListSizeInputType>;
    readonly popupWidth: InputSignal<ListSizeInputType>;
    readonly readonly: InputSignal<boolean>;
    readonly touch: OutputEmitterRef<void>;
}

export const DROPDOWN_POPUP_INPUT_TOKEN = new InjectionToken<DropdownPopupInput>("DROPDOWN_POPUP_INPUT");
