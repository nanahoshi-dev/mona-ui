import { InjectionToken, InputSignal, OutputEmitterRef } from "@angular/core";
import { ListSizeInputType } from "../../common/list/models/ListSizeType";
import { PopupCloseEvent } from "../../popup/models/PopupCloseEvent";
import { PreventableEvent } from "../../utils/PreventableEvent";

export interface DropdownPopupInput {
    readonly close: OutputEmitterRef<PopupCloseEvent>;
    readonly open: OutputEmitterRef<PreventableEvent>;
    readonly readonly: InputSignal<boolean>;
    readonly popupHeight: InputSignal<ListSizeInputType>;
    readonly popupWidth: InputSignal<ListSizeInputType>;
}

export const DropdownPopupInputToken = new InjectionToken<DropdownPopupInput>("DROPDOWN_POPUP_INPUT");
