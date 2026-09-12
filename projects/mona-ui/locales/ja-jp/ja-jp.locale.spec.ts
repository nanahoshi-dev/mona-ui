import { describe, expect, it } from "vitest";
import { MONA_JA_JP_LOCALE } from "./ja-jp.locale";
import { JA_JP_MESSAGES } from "./ja-jp.messages";

describe("MONA_JA_JP_LOCALE", () => {
    describe("metadata", () => {
        it("declares ja-JP locale id", () => {
            expect(MONA_JA_JP_LOCALE.id).toBe("ja-JP");
        });

        it("canonicalizes to ja-JP via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_JA_JP_LOCALE.id)[0]).toBe("ja-JP");
        });

        it("declares ltr direction", () => {
            expect(MONA_JA_JP_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to JA_JP_MESSAGES", () => {
            expect(MONA_JA_JP_LOCALE.messages).toBe(JA_JP_MESSAGES);
            expect(typeof MONA_JA_JP_LOCALE.messages).toBe("object");
        });
    });

    describe("completeness", () => {
        const expectedNamespaces = [
            "autoComplete",
            "breadcrumb",
            "buttonGroup",
            "calendar",
            "card",
            "chart",
            "chip",
            "colorGradient",
            "colorPalette",
            "colorPicker",
            "comboBox",
            "datePicker",
            "dateTimePicker",
            "dialog",
            "dropdownList",
            "dropdowns",
            "editor",
            "filter",
            "grid",
            "list",
            "listBox",
            "multiSelect",
            "notification",
            "numericTextBox",
            "otpInput",
            "pager",
            "rating",
            "scrollView",
            "sheet",
            "slider",
            "spinner",
            "splitButton",
            "splitter",
            "stepper",
            "tabs",
            "textBox",
            "timePicker",
            "timeSelector",
            "treeView",
            "window"
        ] as const;

        it("defines all 40 canonical message namespaces", () => {
            for (const ns of expectedNamespaces) {
                expect(MONA_JA_JP_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_JA_JP_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager?.firstPageLabel).toBe("最初のページ");
            expect(m.pager?.lastPageLabel).toBe("最後のページ");
            expect(m.pager?.nextPageLabel).toBe("次のページ");
            expect(m.pager?.previousPageLabel).toBe("前のページ");
            expect(m.pager?.ofText).toBe("/");
            expect(m.pager?.pageText).toBe("ページ");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("1ページあたり10件");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid?.all).toBe("(すべて)");
            expect(m.grid?.delete).toBe("削除");
            expect(m.grid?.deleteRowConfirmation).toBe("この行を削除しますか？");
            expect(m.grid?.deleteRowTitle).toBe("行を削除");
            expect(m.grid?.edit).toBe("編集");
            expect(m.grid?.filterPlaceholder).toBe("フィルター...");
            expect(m.grid?.noData).toBe("データがありません");
            expect(m.grid?.moveAsNext).toBe("次へ移動");
            expect(m.grid?.moveAsPrevious).toBe("前へ移動");
            expect(m.grid?.remove).toBe("削除");
            expect(m.grid?.save).toBe("保存");
            expect(m.grid?.selectAllRows).toBe("すべての行を選択");
        });

        it("translates ListBox messages correctly", () => {
            expect(m.listBox?.clearSelection).toBe("選択をクリア");
            expect(m.listBox?.moveDown).toBe("下へ移動");
            expect(m.listBox?.moveUp).toBe("上へ移動");
            expect(m.listBox?.remove).toBe("削除");
            expect(m.listBox?.transferFrom).toBe("もう一方のリストから移動");
            expect(m.listBox?.transferTo).toBe("もう一方のリストへ移動");
            expect(m.listBox?.transferAllFrom).toBe("すべてをもう一方のリストから移動");
            expect(m.listBox?.transferAllTo).toBe("すべてをもう一方のリストへ移動");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("太字");
            expect(m.editor?.italic).toBe("斜体");
            expect(m.editor?.underline).toBe("下線");
            expect(m.editor?.strikethrough).toBe("取り消し線");
            expect(m.editor?.insertLink).toBe("リンクを挿入");
            expect(m.editor?.removeLink).toBe("リンクを削除");
            expect(m.editor?.codeBlock).toBe("コードブロック");
            expect(m.editor?.quotation).toBe("引用");
            expect(m.editor?.undo).toBe("元に戻す");
            expect(m.editor?.redo).toBe("やり直す");
            expect(m.editor?.alignCenter).toBe("中央揃え");
            expect(m.editor?.insertTable).toBe("表を挿入");
            expect(m.editor?.deleteTable).toBe("表を削除");
            expect(m.editor?.format).toBe("書式");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("今日");
            expect(m.calendar?.nextMonth).toBe("次の月");
            expect(m.calendar?.previousMonth).toBe("前の月");
            expect(m.calendar?.nextYear).toBe("次の年");
            expect(m.calendar?.previousYear).toBe("前の年");
            expect(m.datePicker?.datePicker).toBe("日付選択");
            expect(m.datePicker?.openCalendar).toBe("カレンダーを開く");
        });

        it("translates TimeSelector & TimePicker messages correctly", () => {
            expect(m.timeSelector?.am).toBe("午前");
            expect(m.timeSelector?.pm).toBe("午後");
            expect(m.timeSelector?.amPm).toBe("午前/午後");
            expect(m.timeSelector?.timeSelector).toBe("時刻選択");
            expect(m.timeSelector?.now).toBe("現在時刻");
            expect(m.timeSelector?.set).toBe("設定");
            expect(m.timePicker?.timePicker).toBe("時刻選択");
            expect(m.timePicker?.openTimePicker).toBe("時刻選択を開く");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("値を減らす");
            expect(m.numericTextBox?.increase).toBe("値を増やす");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("クリア");
            expect(m.dropdownList?.clear).toBe("クリア");
            expect(m.dropdowns?.noResultsFound).toBe("結果が見つかりません");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("OK");
            expect(m.dialog?.cancel).toBe("キャンセル");
            expect(m.dialog?.closeDialog).toBe("ダイアログを閉じる");
            expect(m.window?.close).toBe("閉じる");
            expect(m.window?.closeWindow).toBe("ウィンドウを閉じる");
            expect(m.window?.maximize).toBe("最大化");
            expect(m.window?.minimize).toBe("最小化");
            expect(m.window?.restore).toBe("元のサイズに戻す");
            expect(m.window?.moveWindow).toBe("ウィンドウを移動。矢印キーで移動します。");
            expect(m.window?.resizeTop).toBe("上辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。");
            expect(m.window?.resizeBottom).toBe("下辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。");
            expect(m.window?.resizeLeft).toBe("左辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。");
            expect(m.window?.resizeRight).toBe("右辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。");
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("折りたたむ");
            expect(m.treeView?.expand).toBe("展開");
            expect(m.treeView?.filterTree).toBe("ツリーをフィルター");
            expect(m.list?.noData).toBe("データがありません");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("カルーセル");
            expect(m.scrollView?.slide).toBe("スライド");
            expect(m.scrollView?.nextPage).toBe("次のページ");
            expect(m.scrollView?.previousPage).toBe("前のページ");
            expect(m.scrollView?.scrollPagerNext).toBe("ページャーを次へスクロール");
            expect(m.scrollView?.scrollPagerPrevious).toBe("ページャーを前へスクロール");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("読み込み中");
            expect(m.spinner?.cancel).toBe("キャンセル");
            expect(m.notification?.close).toBe("閉じる");
            expect(m.notification?.success).toBe("成功");
            expect(m.notification?.error).toBe("エラー");
            expect(m.notification?.warning).toBe("警告");
            expect(m.notification?.info).toBe("情報");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("シートを閉じる");
            expect(m.splitter?.resizer).toBe("サイズ変更ハンドル");
            expect(m.splitter?.collapsePrevious).toBe("前のペインを折りたたむ");
            expect(m.splitter?.collapseNext).toBe("次のペインを折りたたむ");
            expect(m.splitter?.collapseUp).toBe("上のペインを折りたたむ");
            expect(m.splitter?.collapseDown).toBe("下のペインを折りたたむ");
            expect(m.stepper?.stepProgress).toBe("ステップの進行状況");
            expect(m.stepper?.stepper).toBe("ステップ表示");
            expect(m.tabs?.closeTab).toBe("タブを閉じる");
        });

        it("translates Filter date and boolean operators correctly", () => {
            expect(m.filter?.isAfterOrEqualTo).toBe("以降");
            expect(m.filter?.isBeforeOrEqualTo).toBe("以前");
            expect(m.filter?.isAfter).toBe("より後");
            expect(m.filter?.isBefore).toBe("より前");
            expect(m.filter?.isEqualTo).toBe("等しい");
            expect(m.filter?.isNotEqualTo).toBe("等しくない");
            expect(m.filter?.isNull).toBe("null である");
            expect(m.filter?.isNotNull).toBe("null ではない");
            expect(m.filter?.isTrue).toBe("true である");
            expect(m.filter?.isFalse).toBe("false である");
        });

        it("translates ColorGradient accessibility labels correctly", () => {
            expect(m.colorGradient?.saturationAndValue).toBe("彩度と明度");
        });

        it("translates Grid row-reorder disabled reasons correctly", () => {
            expect(m.grid?.rowReorderDisabled).toBe("行の並べ替えは無効です。");
            expect(m.grid?.rowReorderDisabledEditing).toBe("行を並べ替える前に編集を完了してください。");
            expect(m.grid?.rowReorderDisabledFiltered).toBe("行を並べ替える前にフィルターを解除してください。");
            expect(m.grid?.rowReorderDisabledGrouped).toBe("行を並べ替える前にグループ化を解除してください。");
            expect(m.grid?.rowReorderDisabledSingleRow).toBe("行を並べ替えるには2行以上必要です。");
            expect(m.grid?.rowReorderDisabledSorted).toBe("行を並べ替える前にソートを解除してください。");
            expect(m.grid?.rowReorderDisabledVirtualScroll).toBe(
                "仮想スクロールが有効な場合、行の並べ替えは使用できません。"
            );
            expect(m.grid?.rowReorderKeyboardHint).toBe(
                "Alt + 上矢印または Alt + 下矢印で行を移動します。"
            );
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_JA_JP_LOCALE.messages;

        it("formats Calendar functions correctly with Japanese date word order and suffixes", () => {
            expect(m.calendar?.calendarLabel?.("2026年9月")).toBe("2026年9月のカレンダー");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020年～2029年");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("2020年から2029年までの10年表示");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("2026年");
            expect(m.calendar?.yearViewLabel?.("2026年")).toBe("年表示、2026年");
            expect(m.calendar?.goToToday?.("2026年9月15日")).toBe("今日（2026年9月15日）に移動");
            expect(m.calendar?.switchToYearView?.("2026年9月")).toBe(
                "年表示に切り替える。現在は2026年9月"
            );
            expect(m.calendar?.switchToDecadeView?.("2026年")).toBe(
                "10年表示に切り替える。現在は2026年"
            );
        });

        it("formats Chart functions and preserves Japanese financial terminology", () => {
            expect(m.chart?.open).toBe("始値");
            expect(m.chart?.high).toBe("高値");
            expect(m.chart?.low).toBe("安値");
            expect(m.chart?.close).toBe("終値");
            expect(m.chart?.openAbbreviation).toBe("始");
            expect(m.chart?.highAbbreviation).toBe("高");
            expect(m.chart?.lowAbbreviation).toBe("安");
            expect(m.chart?.closeAbbreviation).toBe("終");
            expect(m.chart?.rangeDescription?.("収益", "0", "100")).toBe("収益、0から100まで");
            expect(m.chart?.divergingRangeDescription?.("収益性", "-10", "0", "+10")).toBe(
                "収益性、-10から+10まで、中間点0"
            );
        });

        it("formats Chip removeLabel function correctly for both labelled and unlabelled cases", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Angularを削除");
            expect(m.chip?.removeLabel?.()).toBe("項目を削除");
        });

        it("formats ColorGradient saturationAndValueText function correctly", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("彩度50%、明度75%");
        });

        it("formats ColorPalette color function correctly", () => {
            expect(m.colorPalette?.color?.("#FF00AA")).toBe("色: #FF00AA");
        });

        it("formats Dropdowns functions with Japanese counters and no plural branches", () => {
            expect(m.dropdowns?.itemPosition?.("オプション 1", 1, 10)).toBe("オプション 1、10件中1件目");
            expect(m.dropdowns?.resultsAvailable?.(0)).toBe("0件の結果があります");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1件の結果があります");
            expect(m.dropdowns?.resultsAvailable?.(5)).toBe("5件の結果があります");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("見出し1");
            expect(m.editor?.heading?.(3)).toBe("見出し3");
        });

        it("formats Grid functions correctly with Japanese row/column terminology and counters", () => {
            expect(m.grid?.columnsSelected?.(0)).toBe("0列を選択中");
            expect(m.grid?.columnsSelected?.(1)).toBe("1列を選択中");
            expect(m.grid?.columnsSelected?.(3)).toBe("3列を選択中");
            expect(m.grid?.filterByColumn?.("名前")).toBe("名前でフィルター");
            expect(m.grid?.reorderRow?.(4)).toBe("4行目を並べ替え");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "1行目を並べ替え",
                    "Alt + 上矢印または Alt + 下矢印で行を移動します。"
                )
            ).toBe("1行目を並べ替え。Alt + 上矢印または Alt + 下矢印で行を移動します。");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "1行目を並べ替え",
                    "Alt + 上矢印または Alt + 下矢印で行を移動します。",
                    "行の並べ替えは無効です。"
                )
            ).toBe("1行目を並べ替え。Alt + 上矢印または Alt + 下矢印で行を移動します。行の並べ替えは無効です。");
            expect(m.grid?.rowReorderMoved?.(3, 2)).toBe("3行目を2番目の位置に移動しました。");
            expect(m.grid?.selectRow?.(2)).toBe("2行目を選択");
        });

        it("formats MultiSelect itemsCount function with Japanese counters", () => {
            expect(m.multiSelect?.itemsCount?.(0)).toBe("+ 0件");
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1件");
            expect(m.multiSelect?.itemsCount?.(4)).toBe("+ 4件");
        });

        it("formats Pager functions correctly with Japanese counters and no plural branches", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("3ページ");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("1ページあたり10件");
            expect(m.pager?.pageStatus?.(2, 5)).toBe("5ページ中2ページ");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("1ページ戻る");
            expect(m.pager?.jumpBackwardLabel?.(3)).toBe("3ページ戻る");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("1ページ進む");
            expect(m.pager?.jumpForwardLabel?.(5)).toBe("5ページ進む");
        });

        it("formats Pager rangeStatus with correct Japanese counter and ordering", () => {
            expect(m.pager?.rangeStatus?.(1, 1, 1)).toBe("全1件中1～1件");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("全50件中1～10件");
            expect(m.pager?.rangeStatus?.(1, 20, 100)).toBe("全100件中1～20件");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("5段階中4");
        });

        it("formats ScrollView page functions correctly with Japanese ordering", () => {
            expect(m.scrollView?.page?.(1)).toBe("1ページ");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("8ページ中2ページ");
        });

        it("formats SplitButton function correctly for both text and empty states", () => {
            expect(m.splitButton?.splitButton?.("保存")).toBe("保存、分割ボタン");
            expect(m.splitButton?.splitButton?.("")).toBe("分割ボタン");
        });
    });
});
