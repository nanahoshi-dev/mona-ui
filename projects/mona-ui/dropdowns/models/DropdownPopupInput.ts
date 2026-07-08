import { InjectionToken, InputSignal, OutputEmitterRef } from "@angular/core";
import { ListSizeInputType } from "@mirei/mona-ui/internal/list";
import { PopupCloseEvent } from "@mirei/mona-ui/popup";
import { PreventableEvent } from "@mirei/mona-ui/common";

export interface DropdownPopupInput {
    readonly close: OutputEmitterRef<PopupCloseEvent>;
    readonly closed: OutputEmitterRef<void>;
    readonly disabled: InputSignal<boolean>;
    readonly open: OutputEmitterRef<PreventableEvent>;
    readonly opened: OutputEmitterRef<void>;
    readonly readonly: InputSignal<boolean>;
    readonly popupHeight: InputSignal<ListSizeInputType>;
    readonly popupWidth: InputSignal<ListSizeInputType>;
}

export const DropdownPopupInputToken = new InjectionToken<DropdownPopupInput>("DROPDOWN_POPUP_INPUT");
