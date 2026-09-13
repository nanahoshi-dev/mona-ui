import { describe, expect, it } from "vitest";
import { MONA_ZH_CN_LOCALE } from "../zh-cn/zh-cn.locale";
import { MONA_ZH_TW_LOCALE } from "./zh-tw.locale";
import { ZH_TW_MESSAGES } from "./zh-tw.messages";

describe("MONA_ZH_TW_LOCALE", () => {
    describe("metadata", () => {
        it("declares zh-TW locale id", () => {
            expect(MONA_ZH_TW_LOCALE.id).toBe("zh-TW");
            expect(MONA_ZH_TW_LOCALE.id).not.toBe("zh");
            expect(MONA_ZH_TW_LOCALE.id).not.toBe("zh_TW");
            expect(MONA_ZH_TW_LOCALE.id).not.toBe("zh-tw");
            expect(MONA_ZH_TW_LOCALE.id).not.toBe("zh-Hant");
        });

        it("canonicalizes to zh-TW via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_ZH_TW_LOCALE.id)[0]).toBe("zh-TW");
        });

        it("declares ltr direction", () => {
            expect(MONA_ZH_TW_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to ZH_TW_MESSAGES", () => {
            expect(MONA_ZH_TW_LOCALE.messages).toBe(ZH_TW_MESSAGES);
            expect(typeof MONA_ZH_TW_LOCALE.messages).toBe("object");
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
            expect(Object.keys(MONA_ZH_TW_LOCALE.messages)).toHaveLength(40);
            expect(Object.keys(MONA_ZH_TW_LOCALE.messages).sort()).toEqual([...expectedNamespaces].sort());
            for (const ns of expectedNamespaces) {
                expect(MONA_ZH_TW_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_ZH_TW_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager.firstPageLabel).toBe("第一頁");
            expect(m.pager.lastPageLabel).toBe("最後一頁");
            expect(m.pager.nextPageLabel).toBe("下一頁");
            expect(m.pager.previousPageLabel).toBe("上一頁");
            expect(m.pager.ofText).toBe("/");
            expect(m.pager.pageText).toBe("頁");
            expect(m.pager.pageSizeLabel(10)).toBe("每頁 10 筆");
            expect(m.pager.pageLabel(3)).toBe("第 3 頁");
            expect(m.pager.pageStatus(2, 5)).toBe("第 2 頁，共 5 頁");
            expect(m.pager.rangeStatus(1, 10, 50)).toBe("第 1 - 10 項，共 50 項");
        });

        it("translates Grid messages with Taiwan terminology (資料列 for row, 欄 for column)", () => {
            expect(m.grid.all).toBe("(全部)");
            expect(m.grid.apply).toBe("套用");
            expect(m.grid.cancel).toBe("取消");
            expect(m.grid.cancelRowEdit).toBe("取消編輯資料列");
            expect(m.grid.columns).toBe("欄");
            expect(m.grid.delete).toBe("刪除");
            expect(m.grid.deleteRowConfirmation).toBe("確定要刪除此項目嗎？");
            expect(m.grid.deleteRowTitle).toBe("刪除資料列？");
            expect(m.grid.edit).toBe("編輯");
            expect(m.grid.editRow).toBe("編輯資料列");
            expect(m.grid.filterPlaceholder).toBe("篩選…");
            expect(m.grid.noData).toBe("沒有資料");
            expect(m.grid.remove).toBe("移除");
            expect(m.grid.removeRow).toBe("移除資料列");
            expect(m.grid.rowReorder).toBe("資料列重新排序");
            expect(m.grid.save).toBe("儲存");
            expect(m.grid.saveRow).toBe("儲存資料列");
            expect(m.grid.selectAllRows).toBe("選取所有資料列");
            expect(m.grid.rowReorderDisabled).toBe("資料列重新排序已停用。");
            expect(m.grid.rowReorderKeyboardHint).toBe("使用 Alt + 向上鍵或 Alt + 向下鍵移動。");
            expect(m.grid.columnsSelected(3)).toBe("已選取 3 欄");
            expect(m.grid.filterByColumn("名稱")).toBe("依 名稱 篩選");
            expect(m.grid.reorderRow(2)).toBe("重新排列第 2 個資料列");
            expect(m.grid.selectRow(5)).toBe("選取第 5 個資料列");
            expect(m.grid.rowReorderMoved(2, 4)).toBe("已將第 2 個資料列移至位置 4。");
            expect(m.grid.rowReorderDisabledSingleRow).toBe("至少需要兩個資料列才能重新排序。");
            expect(m.grid.reorderRow(2)).not.toMatch(/第 2 列$/);
            expect(m.grid.selectRow(5)).not.toMatch(/第 5 列$/);
            expect(m.grid.rowReorderMoved(2, 4)).not.toContain("第 2 列");
            expect(m.grid.rowReorderDisabledSingleRow).not.toContain("兩列");
        });

        it("translates ListBox messages with descriptive accessible transfer labels", () => {
            expect(m.listBox.clearSelection).toBe("清除選取");
            expect(m.listBox.moveDown).toBe("向下移動");
            expect(m.listBox.moveUp).toBe("向上移動");
            expect(m.listBox.remove).toBe("移除");
            expect(m.listBox.transferFrom).toBe("從另一清單移入");
            expect(m.listBox.transferTo).toBe("移至另一清單");
            expect(m.listBox.transferAllFrom).toBe("從另一清單全部移入");
            expect(m.listBox.transferAllTo).toBe("全部移至另一清單");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor.bold).toBe("粗體");
            expect(m.editor.italic).toBe("斜體");
            expect(m.editor.underline).toBe("底線");
            expect(m.editor.strikethrough).toBe("刪除線");
            expect(m.editor.insertLink).toBe("插入連結");
            expect(m.editor.removeLink).toBe("移除連結");
            expect(m.editor.codeBlock).toBe("程式碼區塊");
            expect(m.editor.quotation).toBe("引用");
            expect(m.editor.undo).toBe("復原");
            expect(m.editor.redo).toBe("重做");
            expect(m.editor.alignCenter).toBe("置中對齊");
            expect(m.editor.insertTable).toBe("插入表格");
            expect(m.editor.deleteTable).toBe("刪除表格");
            expect(m.editor.fontSize).toBe("字型大小");
            expect(m.editor.format).toBe("格式");
            expect(m.editor.heading(2)).toBe("標題 2");
        });

        it("translates Calendar, DatePicker, and DateTimePicker messages correctly", () => {
            expect(m.calendar.today).toBe("今天");
            expect(m.calendar.nextMonth).toBe("下個月");
            expect(m.calendar.previousMonth).toBe("上個月");
            expect(m.calendar.nextYear).toBe("下一年");
            expect(m.calendar.previousYear).toBe("上一年");
            expect(m.calendar.nextDecade).toBe("下個十年");
            expect(m.calendar.previousDecade).toBe("上個十年");
            expect(m.datePicker.datePicker).toBe("日期選取器");
            expect(m.datePicker.openCalendar).toBe("開啟行事曆");
            expect(m.dateTimePicker.dateTimePicker).toBe("日期時間選取器");
            expect(m.dateTimePicker.set).toBe("設定");
            expect(m.dateTimePicker.cancel).toBe("取消");
        });

        it("translates TimeSelector and TimePicker messages correctly", () => {
            expect(m.timeSelector.am).toBe("上午");
            expect(m.timeSelector.pm).toBe("下午");
            expect(m.timeSelector.amPm).toBe("上午/下午");
            expect(m.timeSelector.hours).toBe("小時");
            expect(m.timeSelector.minutes).toBe("分鐘");
            expect(m.timeSelector.seconds).toBe("秒");
            expect(m.timeSelector.now).toBe("目前時間");
            expect(m.timeSelector.set).toBe("設定");
            expect(m.timePicker.timePicker).toBe("時間選取器");
            expect(m.timePicker.openTimePicker).toBe("開啟時間選取器");
        });

        it("translates Dialog, Window, and notification messages correctly", () => {
            expect(m.dialog.ok).toBe("確定");
            expect(m.dialog.cancel).toBe("取消");
            expect(m.dialog.closeDialog).toBe("關閉對話方塊");
            expect(m.window.close).toBe("關閉");
            expect(m.window.closeWindow).toBe("關閉視窗");
            expect(m.window.maximize).toBe("最大化");
            expect(m.window.minimize).toBe("最小化");
            expect(m.window.restore).toBe("還原");
            expect(m.notification.error).toBe("錯誤");
            expect(m.notification.success).toBe("成功");
            expect(m.notification.warning).toBe("警告");
            expect(m.notification.info).toBe("資訊");
        });

        it("translates TreeView, ScrollView, Spinner, Sheet, Splitter, Stepper, Tabs", () => {
            expect(m.treeView.expand).toBe("展開");
            expect(m.treeView.collapse).toBe("摺疊");
            expect(m.treeView.filter).toBe("篩選");
            expect(m.treeView.filterTree).toBe("篩選樹狀檢視");
            expect(m.treeView.filterTree).not.toContain("樹狀圖");
            expect(m.scrollView.carousel).toBe("輪播");
            expect(m.scrollView.slide).toBe("投影片");
            expect(m.scrollView.nextPage).toBe("下一頁");
            expect(m.scrollView.previousPage).toBe("上一頁");
            expect(m.scrollView.scrollPagerNext).toBe("向後捲動分頁器");
            expect(m.scrollView.scrollPagerPrevious).toBe("向前捲動分頁器");
            expect(m.spinner.loading).toBe("載入中");
            expect(m.spinner.cancel).toBe("取消");
            expect(m.sheet.closeSheet).toBe("關閉面板");
            expect(m.splitter.resizer).toBe("調整大小控點");
            expect(m.stepper.stepper).toBe("步驟指示器");
            expect(m.stepper.stepProgress).toBe("步驟進度");
            expect(m.tabs.closeTab).toBe("關閉分頁");
        });

        it("translates Filter, ColorGradient, Chip, SplitButton", () => {
            expect(m.filter.and).toBe("且");
            expect(m.filter.or).toBe("或");
            expect(m.filter.apply).toBe("套用");
            expect(m.filter.clear).toBe("清除");
            expect(m.filter.contains).toBe("包含");
            expect(m.filter.doesNotContain).toBe("不包含");
            expect(m.filter.isAfter).toBe("晚於");
            expect(m.filter.isBefore).toBe("早於");
            expect(m.colorGradient.apply).toBe("套用");
            expect(m.colorGradient.cancel).toBe("取消");
            expect(m.chip.removeLabel("標籤")).toBe("移除標籤");
            expect(m.chip.removeLabel()).toBe("移除項目");
            expect(m.splitButton.menuButtonAriaLabel).toBe("顯示選單選項");
            expect(m.splitButton.splitButton("儲存")).toBe("儲存，分割按鈕");
            expect(m.splitButton.splitButton("")).toBe("分割按鈕");
        });
    });

    describe("function-valued message evaluation and parameter composition", () => {
        const m = MONA_ZH_TW_LOCALE.messages;

        it("evaluates calendar function messages without duplicate year suffixes", () => {
            expect(m.calendar.calendarLabel("2026年9月")).toBe("2026年9月行事曆");
            expect(m.calendar.yearViewLabel("2026年")).toBe("年份檢視，2026年");
            expect(m.calendar.decadeViewLabel(2020, 2029)).toBe("2020年至2029年十年檢視");
            expect(m.calendar.goToToday("2026年9月15日")).toBe("移至今天（2026年9月15日）");
            expect(m.calendar.switchToYearView("2026年9月")).toBe("切換至年份檢視，目前為2026年9月");
            expect(m.calendar.switchToDecadeView("2026年")).toBe("切換至十年檢視，目前為2026年");
            expect(m.calendar.decadeRange(2020, 2029)).toBe("2020年至2029年");
            expect(m.calendar.yearCellLabel(2026)).toBe("2026年");
        });

        it("evaluates chart range descriptions", () => {
            expect(m.chart.rangeDescription("銷量", "10", "100")).toBe("銷量，10 至 100");
            expect(m.chart.divergingRangeDescription("利潤", "-50", "0", "100")).toBe("利潤，-50 至 0 至 100");
        });

        it("evaluates count-dependent messages with stable Chinese grammar", () => {
            const counts = [0, 1, 2, 5, 10];
            for (const count of counts) {
                expect(m.dropdowns.resultsAvailable(count)).toBe(`有 ${count} 個可用結果`);
                expect(m.multiSelect.itemsCount(count)).toBe(`+ ${count} 項`);
                expect(m.grid.columnsSelected(count)).toBe(`已選取 ${count} 欄`);
                expect(m.pager.jumpBackwardLabel(count)).toBe(`後退 ${count} 頁`);
                expect(m.pager.jumpForwardLabel(count)).toBe(`前進 ${count} 頁`);
                expect(m.pager.pageSizeLabel(count)).toBe(`每頁 ${count} 筆`);
                expect(m.scrollView.page(count)).toBe(`第 ${count} 頁`);
            }
        });

        it("evaluates Grid row reorder accessibility announcements", () => {
            const handleLabel = m.grid.rowReorderHandleAriaLabel("第 1 個資料列", "使用 Alt + 向上鍵移動。");
            expect(handleLabel).toBe("第 1 個資料列。使用 Alt + 向上鍵移動。");

            const disabledHandle = m.grid.rowReorderHandleAriaLabel("第 1 個資料列", "使用方向鍵移動。", "資料列重新排序已停用。");
            expect(disabledHandle).toBe("第 1 個資料列。使用方向鍵移動。 資料列重新排序已停用。");

            expect(m.grid.rowReorderMoved(3, 1)).toBe("已將第 3 個資料列移至位置 1。");
        });

        it("evaluates ColorGradient accessibility label", () => {
            expect(m.colorGradient.saturationAndValueText(80, 50)).toBe("飽和度80%，明度50%");
        });

        it("evaluates Rating value text across scale levels", () => {
            expect(m.rating.valueText(4, 5)).toBe("第 4 級，共 5 級");
            expect(m.rating.valueText(0, 10)).toBe("第 0 級，共 10 級");
            expect(m.rating.valueText(1, 1)).toBe("第 1 級，共 1 級");
        });
    });

    describe("direct regional-difference assertions against zh-CN", () => {
        const cn = MONA_ZH_CN_LOCALE.messages;
        const tw = MONA_ZH_TW_LOCALE.messages;

        it("differs intentionally on core software action verbs", () => {
            expect(tw.colorGradient.apply).toBe("套用");
            expect(cn.colorGradient.apply).toBe("应用");

            expect(tw.grid.save).toBe("儲存");
            expect(cn.grid.save).toBe("保存");

            expect(tw.spinner.loading).toBe("載入中");
            expect(cn.spinner.loading).toBe("加载中");

            expect(tw.editor.undo).toBe("復原");
            expect(cn.editor.undo).toBe("撤销");
        });

        it("differs intentionally on Grid terminology (資料列/欄 vs 行/列)", () => {
            expect(tw.grid.columns).toBe("欄");
            expect(cn.grid.columns).toBe("列");

            expect(tw.grid.columnsSelected(3)).toBe("已選取 3 欄");
            expect(cn.grid.columnsSelected(3)).toBe("已选择 3 列");

            expect(tw.grid.cancelRowEdit).toBe("取消編輯資料列");
            expect(cn.grid.cancelRowEdit).toBe("取消编辑行");

            expect(tw.grid.noData).toBe("沒有資料");
            expect(cn.grid.noData).toBe("没有数据");
        });

        it("differs intentionally on editor and UI components", () => {
            expect(tw.editor.insertLink).toBe("插入連結");
            expect(cn.editor.insertLink).toBe("插入链接");

            expect(tw.editor.fontSize).toBe("字型大小");
            expect(cn.editor.fontSize).toBe("字号");

            expect(tw.editor.underline).toBe("底線");
            expect(cn.editor.underline).toBe("下划线");

            expect(tw.window.closeWindow).toBe("關閉視窗");
            expect(cn.window.closeWindow).toBe("关闭窗口");

            expect(tw.scrollView.slide).toBe("投影片");
            expect(cn.scrollView.slide).toBe("幻灯片");

            expect(tw.scrollView.scrollPagerNext).toBe("向後捲動分頁器");
            expect(cn.scrollView.scrollPagerNext).toBe("向后滚动分页器");

            expect(tw.slider.sliderValue).toBe("滑桿數值");
            expect(cn.slider.sliderValue).toBe("滑块数值");

            expect(tw.colorPalette.colorPalette).toBe("調色盤");
            expect(cn.colorPalette.colorPalette).toBe("调色板");

            expect(tw.splitButton.splitButton("測試")).toBe("測試，分割按鈕");
            expect(cn.splitButton.splitButton("测试")).toBe("测试，拆分按钮");
        });
    });
});
