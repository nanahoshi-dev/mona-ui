import { describe, expect, it } from "vitest";
import { MONA_ZH_TW_LOCALE } from "../zh-tw/zh-tw.locale";
import { MONA_ZH_CN_LOCALE } from "./zh-cn.locale";
import { ZH_CN_MESSAGES } from "./zh-cn.messages";

describe("MONA_ZH_CN_LOCALE", () => {
    describe("metadata", () => {
        it("declares zh-CN locale id", () => {
            expect(MONA_ZH_CN_LOCALE.id).toBe("zh-CN");
            expect(MONA_ZH_CN_LOCALE.id).not.toBe("zh");
            expect(MONA_ZH_CN_LOCALE.id).not.toBe("zh_CN");
            expect(MONA_ZH_CN_LOCALE.id).not.toBe("zh-cn");
            expect(MONA_ZH_CN_LOCALE.id).not.toBe("zh-Hans");
        });

        it("canonicalizes to zh-CN via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_ZH_CN_LOCALE.id)[0]).toBe("zh-CN");
        });

        it("declares ltr direction", () => {
            expect(MONA_ZH_CN_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to ZH_CN_MESSAGES", () => {
            expect(MONA_ZH_CN_LOCALE.messages).toBe(ZH_CN_MESSAGES);
            expect(typeof MONA_ZH_CN_LOCALE.messages).toBe("object");
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
            expect(Object.keys(MONA_ZH_CN_LOCALE.messages)).toHaveLength(40);
            expect(Object.keys(MONA_ZH_CN_LOCALE.messages).sort()).toEqual([...expectedNamespaces].sort());
            for (const ns of expectedNamespaces) {
                expect(MONA_ZH_CN_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_ZH_CN_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager.firstPageLabel).toBe("第一页");
            expect(m.pager.lastPageLabel).toBe("最后一页");
            expect(m.pager.nextPageLabel).toBe("下一页");
            expect(m.pager.previousPageLabel).toBe("上一页");
            expect(m.pager.ofText).toBe("/");
            expect(m.pager.pageText).toBe("页");
            expect(m.pager.pageSizeLabel(10)).toBe("每页 10 条");
            expect(m.pager.pageLabel(3)).toBe("第 3 页");
            expect(m.pager.pageStatus(2, 5)).toBe("第 2 页，共 5 页");
            expect(m.pager.rangeStatus(1, 10, 50)).toBe("第 1 - 10 项，共 50 项");
        });

        it("translates Grid messages with mainland terminology (行 for row, 列 for column)", () => {
            expect(m.grid.all).toBe("(全部)");
            expect(m.grid.apply).toBe("应用");
            expect(m.grid.cancel).toBe("取消");
            expect(m.grid.cancelRowEdit).toBe("取消编辑行");
            expect(m.grid.columns).toBe("列");
            expect(m.grid.delete).toBe("删除");
            expect(m.grid.deleteRowConfirmation).toBe("确定要删除此项吗？");
            expect(m.grid.deleteRowTitle).toBe("删除行？");
            expect(m.grid.edit).toBe("编辑");
            expect(m.grid.editRow).toBe("编辑行");
            expect(m.grid.filterPlaceholder).toBe("筛选…");
            expect(m.grid.noData).toBe("没有数据");
            expect(m.grid.remove).toBe("移除");
            expect(m.grid.removeRow).toBe("移除行");
            expect(m.grid.rowReorder).toBe("行重新排序");
            expect(m.grid.save).toBe("保存");
            expect(m.grid.saveRow).toBe("保存行");
            expect(m.grid.selectAllRows).toBe("选择所有行");
            expect(m.grid.rowReorderDisabled).toBe("行重新排序已禁用。");
            expect(m.grid.rowReorderKeyboardHint).toBe("使用 Alt + 向上键或 Alt + 向下键移动。");
            expect(m.grid.columnsSelected(3)).toBe("已选择 3 列");
            expect(m.grid.filterByColumn("名称")).toBe("按 名称 筛选");
            expect(m.grid.reorderRow(2)).toBe("重新排列第 2 行");
            expect(m.grid.selectRow(5)).toBe("选择第 5 行");
            expect(m.grid.rowReorderMoved(2, 4)).toBe("已将第 2 行移动到位置 4。");
        });

        it("translates ListBox messages with descriptive accessible transfer labels", () => {
            expect(m.listBox.clearSelection).toBe("清除选择");
            expect(m.listBox.moveDown).toBe("向下移动");
            expect(m.listBox.moveUp).toBe("向上移动");
            expect(m.listBox.remove).toBe("移除");
            expect(m.listBox.transferFrom).toBe("从另一列表移入");
            expect(m.listBox.transferTo).toBe("移至另一列表");
            expect(m.listBox.transferAllFrom).toBe("从另一列表全部移入");
            expect(m.listBox.transferAllTo).toBe("全部移至另一列表");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor.bold).toBe("粗体");
            expect(m.editor.italic).toBe("斜体");
            expect(m.editor.underline).toBe("下划线");
            expect(m.editor.strikethrough).toBe("删除线");
            expect(m.editor.insertLink).toBe("插入链接");
            expect(m.editor.removeLink).toBe("移除链接");
            expect(m.editor.codeBlock).toBe("代码块");
            expect(m.editor.quotation).toBe("引用");
            expect(m.editor.undo).toBe("撤销");
            expect(m.editor.redo).toBe("重做");
            expect(m.editor.alignCenter).toBe("居中对齐");
            expect(m.editor.insertTable).toBe("插入表格");
            expect(m.editor.deleteTable).toBe("删除表格");
            expect(m.editor.fontSize).toBe("字号");
            expect(m.editor.format).toBe("格式");
            expect(m.editor.heading(2)).toBe("标题 2");
        });

        it("translates Calendar, DatePicker, and DateTimePicker messages correctly", () => {
            expect(m.calendar.today).toBe("今天");
            expect(m.calendar.nextMonth).toBe("下个月");
            expect(m.calendar.previousMonth).toBe("上个月");
            expect(m.calendar.nextYear).toBe("下一年");
            expect(m.calendar.previousYear).toBe("上一年");
            expect(m.calendar.nextDecade).toBe("下一个十年");
            expect(m.calendar.previousDecade).toBe("上一个十年");
            expect(m.datePicker.datePicker).toBe("日期选择器");
            expect(m.datePicker.openCalendar).toBe("打开日历");
            expect(m.dateTimePicker.dateTimePicker).toBe("日期时间选择器");
            expect(m.dateTimePicker.set).toBe("设置");
            expect(m.dateTimePicker.cancel).toBe("取消");
        });

        it("translates TimeSelector and TimePicker messages correctly", () => {
            expect(m.timeSelector.am).toBe("上午");
            expect(m.timeSelector.pm).toBe("下午");
            expect(m.timeSelector.amPm).toBe("上午/下午");
            expect(m.timeSelector.hours).toBe("小时");
            expect(m.timeSelector.minutes).toBe("分钟");
            expect(m.timeSelector.seconds).toBe("秒");
            expect(m.timeSelector.now).toBe("当前时间");
            expect(m.timeSelector.set).toBe("设置");
            expect(m.timePicker.timePicker).toBe("时间选择器");
            expect(m.timePicker.openTimePicker).toBe("打开时间选择器");
        });

        it("translates Dialog, Window, and notification messages correctly", () => {
            expect(m.dialog.ok).toBe("确定");
            expect(m.dialog.cancel).toBe("取消");
            expect(m.dialog.closeDialog).toBe("关闭对话框");
            expect(m.window.close).toBe("关闭");
            expect(m.window.closeWindow).toBe("关闭窗口");
            expect(m.window.maximize).toBe("最大化");
            expect(m.window.minimize).toBe("最小化");
            expect(m.window.restore).toBe("还原");
            expect(m.notification.error).toBe("错误");
            expect(m.notification.success).toBe("成功");
            expect(m.notification.warning).toBe("警告");
            expect(m.notification.info).toBe("信息");
        });

        it("translates TreeView, ScrollView, Spinner, Sheet, Splitter, Stepper, Tabs", () => {
            expect(m.treeView.expand).toBe("展开");
            expect(m.treeView.collapse).toBe("折叠");
            expect(m.treeView.filter).toBe("筛选");
            expect(m.treeView.filterTree).toBe("筛选树");
            expect(m.scrollView.carousel).toBe("轮播");
            expect(m.scrollView.slide).toBe("幻灯片");
            expect(m.scrollView.nextPage).toBe("下一页");
            expect(m.scrollView.previousPage).toBe("上一页");
            expect(m.scrollView.scrollPagerNext).toBe("向后滚动分页器");
            expect(m.scrollView.scrollPagerPrevious).toBe("向前滚动分页器");
            expect(m.spinner.loading).toBe("加载中");
            expect(m.spinner.cancel).toBe("取消");
            expect(m.sheet.closeSheet).toBe("关闭面板");
            expect(m.splitter.resizer).toBe("调整大小手柄");
            expect(m.stepper.stepper).toBe("步骤指示器");
            expect(m.stepper.stepProgress).toBe("步骤进度");
            expect(m.tabs.closeTab).toBe("关闭标签页");
        });

        it("translates Filter, ColorGradient, Chip, SplitButton", () => {
            expect(m.filter.and).toBe("与");
            expect(m.filter.or).toBe("或");
            expect(m.filter.apply).toBe("应用");
            expect(m.filter.clear).toBe("清除");
            expect(m.filter.contains).toBe("包含");
            expect(m.filter.doesNotContain).toBe("不包含");
            expect(m.filter.isAfter).toBe("晚于");
            expect(m.filter.isBefore).toBe("早于");
            expect(m.colorGradient.apply).toBe("应用");
            expect(m.colorGradient.cancel).toBe("取消");
            expect(m.chip.removeLabel("标签")).toBe("删除标签");
            expect(m.chip.removeLabel()).toBe("删除项目");
            expect(m.splitButton.menuButtonAriaLabel).toBe("显示菜单选项");
            expect(m.splitButton.splitButton("保存")).toBe("保存，拆分按钮");
            expect(m.splitButton.splitButton("")).toBe("拆分按钮");
        });
    });

    describe("function-valued message evaluation and parameter composition", () => {
        const m = MONA_ZH_CN_LOCALE.messages;

        it("evaluates calendar function messages without duplicate year suffixes", () => {
            expect(m.calendar.calendarLabel("2026年9月")).toBe("2026年9月日历");
            expect(m.calendar.yearViewLabel("2026年")).toBe("年视图，2026年");
            expect(m.calendar.decadeViewLabel(2020, 2029)).toBe("十年视图，2020年至2029年");
            expect(m.calendar.decadeViewLabel(2020, 2029)).not.toContain("年代视图");
            expect(m.calendar.goToToday("2026年9月15日")).toBe("转到今天（2026年9月15日）");
            expect(m.calendar.switchToYearView("2026年9月")).toBe("切换到年视图，当前为2026年9月");
            expect(m.calendar.switchToDecadeView("2026年")).toBe("切换到十年视图，当前为2026年");
            expect(m.calendar.switchToDecadeView("2026年")).not.toContain("年代视图");
            expect(m.calendar.decadeRange(2020, 2029)).toBe("2020年至2029年");
            expect(m.calendar.yearCellLabel(2026)).toBe("2026年");
        });

        it("evaluates chart range descriptions", () => {
            expect(m.chart.rangeDescription("销量", "10", "100")).toBe("销量，10 至 100");
            expect(m.chart.divergingRangeDescription("利润", "-50", "0", "100")).toBe("利润，-50 至 0 至 100");
        });

        it("evaluates count-dependent messages with stable Chinese grammar", () => {
            const counts = [0, 1, 2, 5, 10];
            for (const count of counts) {
                expect(m.dropdowns.resultsAvailable(count)).toBe(`有 ${count} 条可用结果`);
                expect(m.multiSelect.itemsCount(count)).toBe(`+ ${count} 项`);
                expect(m.grid.columnsSelected(count)).toBe(`已选择 ${count} 列`);
                expect(m.pager.jumpBackwardLabel(count)).toBe(`后退 ${count} 页`);
                expect(m.pager.jumpForwardLabel(count)).toBe(`前进 ${count} 页`);
                expect(m.pager.pageSizeLabel(count)).toBe(`每页 ${count} 条`);
                expect(m.scrollView.page(count)).toBe(`第 ${count} 页`);
            }
        });

        it("evaluates Grid row reorder accessibility announcements", () => {
            const handleLabel = m.grid.rowReorderHandleAriaLabel("第 1 行", "使用 Alt + 向上键移动。");
            expect(handleLabel).toBe("第 1 行。使用 Alt + 向上键移动。");

            const disabledHandle = m.grid.rowReorderHandleAriaLabel("第 1 行", "使用方向键移动。", "行重新排序已禁用。");
            expect(disabledHandle).toBe("第 1 行。使用方向键移动。 行重新排序已禁用。");

            expect(m.grid.rowReorderMoved(3, 1)).toBe("已将第 3 行移动到位置 1。");
        });

        it("evaluates ColorGradient accessibility label", () => {
            expect(m.colorGradient.saturationAndValueText(80, 50)).toBe("饱和度80%，明度50%");
        });

        it("evaluates Rating value text across scale levels", () => {
            expect(m.rating.valueText(4, 5)).toBe("第 4 级，共 5 级");
            expect(m.rating.valueText(0, 10)).toBe("第 0 级，共 10 级");
            expect(m.rating.valueText(1, 1)).toBe("第 1 级，共 1 级");
        });
    });

    describe("direct regional-difference assertions against zh-TW", () => {
        const cn = MONA_ZH_CN_LOCALE.messages;
        const tw = MONA_ZH_TW_LOCALE.messages;

        it("differs intentionally on core software action verbs", () => {
            expect(cn.colorGradient.apply).toBe("应用");
            expect(tw.colorGradient.apply).toBe("套用");

            expect(cn.grid.save).toBe("保存");
            expect(tw.grid.save).toBe("儲存");

            expect(cn.spinner.loading).toBe("加载中");
            expect(tw.spinner.loading).toBe("載入中");

            expect(cn.editor.undo).toBe("撤销");
            expect(tw.editor.undo).toBe("復原");
        });

        it("differs intentionally on Grid terminology (行/列 vs 資料列/欄)", () => {
            expect(cn.grid.columns).toBe("列");
            expect(tw.grid.columns).toBe("欄");

            expect(cn.grid.columnsSelected(3)).toBe("已选择 3 列");
            expect(tw.grid.columnsSelected(3)).toBe("已選取 3 欄");

            expect(cn.grid.cancelRowEdit).toBe("取消编辑行");
            expect(tw.grid.cancelRowEdit).toBe("取消編輯資料列");

            expect(cn.grid.noData).toBe("没有数据");
            expect(tw.grid.noData).toBe("沒有資料");
        });

        it("differs intentionally on editor and UI components", () => {
            expect(cn.editor.insertLink).toBe("插入链接");
            expect(tw.editor.insertLink).toBe("插入連結");

            expect(cn.editor.fontSize).toBe("字号");
            expect(tw.editor.fontSize).toBe("字型大小");

            expect(cn.editor.underline).toBe("下划线");
            expect(tw.editor.underline).toBe("底線");

            expect(cn.window.closeWindow).toBe("关闭窗口");
            expect(tw.window.closeWindow).toBe("關閉視窗");

            expect(cn.scrollView.slide).toBe("幻灯片");
            expect(tw.scrollView.slide).toBe("投影片");

            expect(cn.scrollView.scrollPagerNext).toBe("向后滚动分页器");
            expect(tw.scrollView.scrollPagerNext).toBe("向後捲動分頁器");

            expect(cn.slider.sliderValue).toBe("滑块数值");
            expect(tw.slider.sliderValue).toBe("滑桿數值");

            expect(cn.colorPalette.colorPalette).toBe("调色板");
            expect(tw.colorPalette.colorPalette).toBe("調色盤");

            expect(cn.splitButton.splitButton("测试")).toBe("测试，拆分按钮");
            expect(tw.splitButton.splitButton("測試")).toBe("測試，分割按鈕");
        });
    });
});
