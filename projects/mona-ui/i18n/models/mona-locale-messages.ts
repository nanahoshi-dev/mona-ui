import type { MonaAutoCompleteMessages } from "../message-types/auto-complete.messages";
import type { MonaCardMessages } from "../message-types/card.messages";
import type { MonaChipMessages } from "../message-types/chip.messages";
import type { MonaColorGradientMessages } from "../message-types/color-gradient.messages";
import type { MonaColorPaletteMessages } from "../message-types/color-palette.messages";
import type { MonaColorPickerMessages } from "../message-types/color-picker.messages";
import type { MonaComboBoxMessages } from "../message-types/combo-box.messages";
import type { MonaDropdownListMessages } from "../message-types/dropdown-list.messages";
import type { MonaDropdownsMessages } from "../message-types/dropdowns.messages";
import type { MonaListMessages } from "../message-types/list.messages";
import type { MonaMultiSelectMessages } from "../message-types/multi-select.messages";
import type { MonaNumericTextBoxMessages } from "../message-types/numeric-text-box.messages";
import type { MonaOtpInputMessages } from "../message-types/otp-input.messages";
import type { MonaPagerMessages } from "../message-types/pager.messages";
import type { MonaRatingMessages } from "../message-types/rating.messages";
import type { MonaSliderMessages } from "../message-types/slider.messages";
import type { MonaSpinnerMessages } from "../message-types/spinner.messages";
import type { MonaSplitButtonMessages } from "../message-types/split-button.messages";
import type { MonaTextBoxMessages } from "../message-types/text-box.messages";

export interface MonaLocaleMessages extends Record<string, object> {
    autoComplete: MonaAutoCompleteMessages;
    card: MonaCardMessages;
    chip: MonaChipMessages;
    colorGradient: MonaColorGradientMessages;
    colorPalette: MonaColorPaletteMessages;
    colorPicker: MonaColorPickerMessages;
    comboBox: MonaComboBoxMessages;
    dropdownList: MonaDropdownListMessages;
    dropdowns: MonaDropdownsMessages;
    list: MonaListMessages;
    multiSelect: MonaMultiSelectMessages;
    numericTextBox: MonaNumericTextBoxMessages;
    otpInput: MonaOtpInputMessages;
    pager: MonaPagerMessages;
    rating: MonaRatingMessages;
    slider: MonaSliderMessages;
    spinner: MonaSpinnerMessages;
    splitButton: MonaSplitButtonMessages;
    textBox: MonaTextBoxMessages;
}




