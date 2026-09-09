import type { MonaAutoCompleteMessages } from "../message-types/auto-complete.messages";
import type { MonaBreadcrumbMessages } from "../message-types/breadcrumb.messages";
import type { MonaCardMessages } from "../message-types/card.messages";
import type { MonaChipMessages } from "../message-types/chip.messages";
import type { MonaColorGradientMessages } from "../message-types/color-gradient.messages";
import type { MonaColorPaletteMessages } from "../message-types/color-palette.messages";
import type { MonaColorPickerMessages } from "../message-types/color-picker.messages";
import type { MonaComboBoxMessages } from "../message-types/combo-box.messages";
import type { MonaDialogMessages } from "../message-types/dialog.messages";
import type { MonaDropdownListMessages } from "../message-types/dropdown-list.messages";
import type { MonaDropdownsMessages } from "../message-types/dropdowns.messages";
import type { MonaListMessages } from "../message-types/list.messages";
import type { MonaListBoxMessages } from "../message-types/list-box.messages";
import type { MonaMultiSelectMessages } from "../message-types/multi-select.messages";
import type { MonaNumericTextBoxMessages } from "../message-types/numeric-text-box.messages";
import type { MonaOtpInputMessages } from "../message-types/otp-input.messages";
import type { MonaPagerMessages } from "../message-types/pager.messages";
import type { MonaRatingMessages } from "../message-types/rating.messages";
import type { MonaScrollViewMessages } from "../message-types/scroll-view.messages";
import type { MonaSheetMessages } from "../message-types/sheet.messages";
import type { MonaSliderMessages } from "../message-types/slider.messages";
import type { MonaSpinnerMessages } from "../message-types/spinner.messages";
import type { MonaSplitButtonMessages } from "../message-types/split-button.messages";
import type { MonaSplitterMessages } from "../message-types/splitter.messages";
import type { MonaStepperMessages } from "../message-types/stepper.messages";
import type { MonaTabsMessages } from "../message-types/tabs.messages";
import type { MonaTextBoxMessages } from "../message-types/text-box.messages";
import type { MonaTimeSelectorMessages } from "../message-types/time-selector.messages";
import type { MonaTreeViewMessages } from "../message-types/tree-view.messages";
import type { MonaWindowMessages } from "../message-types/window.messages";

export interface MonaLocaleMessages extends Record<string, object> {
    autoComplete: MonaAutoCompleteMessages;
    breadcrumb: MonaBreadcrumbMessages;
    card: MonaCardMessages;
    chip: MonaChipMessages;
    colorGradient: MonaColorGradientMessages;
    colorPalette: MonaColorPaletteMessages;
    colorPicker: MonaColorPickerMessages;
    comboBox: MonaComboBoxMessages;
    dialog: MonaDialogMessages;
    dropdownList: MonaDropdownListMessages;
    dropdowns: MonaDropdownsMessages;
    list: MonaListMessages;
    listBox: MonaListBoxMessages;
    multiSelect: MonaMultiSelectMessages;
    numericTextBox: MonaNumericTextBoxMessages;
    otpInput: MonaOtpInputMessages;
    pager: MonaPagerMessages;
    rating: MonaRatingMessages;
    scrollView: MonaScrollViewMessages;
    sheet: MonaSheetMessages;
    slider: MonaSliderMessages;
    spinner: MonaSpinnerMessages;
    splitButton: MonaSplitButtonMessages;
    splitter: MonaSplitterMessages;
    stepper: MonaStepperMessages;
    tabs: MonaTabsMessages;
    textBox: MonaTextBoxMessages;
    timeSelector: MonaTimeSelectorMessages;
    treeView: MonaTreeViewMessages;
    window: MonaWindowMessages;
}




