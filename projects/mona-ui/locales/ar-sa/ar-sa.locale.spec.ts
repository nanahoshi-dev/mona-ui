import { describe, expect, it } from "vitest";
import { MONA_AR_SA_LOCALE } from "./ar-sa.locale";
import { AR_SA_MESSAGES } from "./ar-sa.messages";

describe("MONA_AR_SA_LOCALE", () => {
    describe("metadata", () => {
        it("declares ar-SA locale id", () => {
            expect(MONA_AR_SA_LOCALE.id).toBe("ar-SA");
        });

        it("canonicalizes to ar-SA via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_AR_SA_LOCALE.id)[0]).toBe("ar-SA");
        });

        it("declares rtl direction", () => {
            expect(MONA_AR_SA_LOCALE.direction).toBe("rtl");
        });

        it("contains messages object identical to AR_SA_MESSAGES", () => {
            expect(MONA_AR_SA_LOCALE.messages).toBe(AR_SA_MESSAGES);
            expect(typeof MONA_AR_SA_LOCALE.messages).toBe("object");
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
                expect(MONA_AR_SA_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_AR_SA_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager.firstPageLabel).toBe("الصفحة الأولى");
            expect(m.pager.lastPageLabel).toBe("الصفحة الأخيرة");
            expect(m.pager.nextPageLabel).toBe("الصفحة التالية");
            expect(m.pager.previousPageLabel).toBe("الصفحة السابقة");
            expect(m.pager.ofText).toBe("من");
            expect(m.pager.pageText).toBe("الصفحة");
            expect(m.pager.pageLabel(1)).toBe("الصفحة ١");
            expect(m.pager.pageSizeLabel(10)).toBe("عدد العناصر في الصفحة: ١٠");
            expect(m.pager.pageStatus(3, 10)).toBe("الصفحة ٣ من ١٠");
            expect(m.pager.rangeStatus(1, 10, 50)).toBe("١–١٠ من ٥٠");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid.all).toBe("(الكل)");
            expect(m.grid.apply).toBe("تطبيق");
            expect(m.grid.cancel).toBe("إلغاء");
            expect(m.grid.cancelRowEdit).toBe("إلغاء تحرير الصف");
            expect(m.grid.columns).toBe("الأعمدة");
            expect(m.grid.delete).toBe("حذف");
            expect(m.grid.deleteRowConfirmation).toBe("هل تريد حذف هذا العنصر؟");
            expect(m.grid.deleteRowTitle).toBe("حذف الصف؟");
            expect(m.grid.dragColumnHeaderToGroup).toBe("اسحب رأس العمود إلى هنا للتجميع");
            expect(m.grid.edit).toBe("تحرير");
            expect(m.grid.editRow).toBe("تحرير الصف");
            expect(m.grid.fieldValidationError).toBe("قيمة غير صالحة.");
            expect(m.grid.filterPlaceholder).toBe("تصفية…");
            expect(m.grid.modified).toBe("تم التعديل");
            expect(m.grid.moveAsNext).toBe("نقل كعنصر تالٍ");
            expect(m.grid.moveAsPrevious).toBe("نقل كعنصر سابق");
            expect(m.grid.moveRow).toBe("نقل الصف");
            expect(m.grid.noData).toBe("لا توجد بيانات");
            expect(m.grid.remove).toBe("إزالة");
            expect(m.grid.removeRow).toBe("إزالة الصف");
            expect(m.grid.resizeColumn).toBe("تغيير عرض العمود");
            expect(m.grid.rowReorder).toBe("إعادة ترتيب الصفوف");
            expect(m.grid.rowReorderDisabled).toBe("إعادة ترتيب الصفوف غير متاح.");
            expect(m.grid.rowReorderDisabledEditing).toBe("أكمل التحرير قبل إعادة ترتيب الصفوف.");
            expect(m.grid.rowReorderDisabledFiltered).toBe("امسح التصفية قبل إعادة ترتيب الصفوف.");
            expect(m.grid.rowReorderDisabledGrouped).toBe("ألغِ التجميع قبل إعادة ترتيب الصفوف.");
            expect(m.grid.rowReorderDisabledSingleRow).toBe("يلزم صفّان على الأقل لإعادة ترتيب الصفوف.");
            expect(m.grid.rowReorderDisabledSorted).toBe("ألغِ الفرز قبل إعادة ترتيب الصفوف.");
            expect(m.grid.rowReorderDisabledVirtualScroll).toBe("لا يمكن إعادة ترتيب الصفوف أثناء استخدام التمرير الافتراضي.");
            expect(m.grid.rowReorderKeyboardHint).toBe("استخدم Alt + سهم لأعلى أو Alt + سهم لأسفل للتحريك.");
            expect(m.grid.rowValidationError).toBe("توجد أخطاء تحقق في هذا الصف.");
            expect(m.grid.save).toBe("حفظ");
            expect(m.grid.saveRow).toBe("حفظ الصف");
            expect(m.grid.selectAllRows).toBe("تحديد كل الصفوف");
        });

        it("translates Calendar messages correctly", () => {
            expect(m.calendar.today).toBe("اليوم");
            expect(m.calendar.nextMonth).toBe("الشهر التالي");
            expect(m.calendar.previousMonth).toBe("الشهر السابق");
            expect(m.calendar.nextYear).toBe("السنة التالية");
            expect(m.calendar.previousYear).toBe("السنة السابقة");
            expect(m.calendar.nextDecade).toBe("العقد التالي");
            expect(m.calendar.previousDecade).toBe("العقد السابق");
        });

        it("translates TimeSelector messages correctly", () => {
            expect(m.timeSelector.am).toBe("ص");
            expect(m.timeSelector.pm).toBe("م");
            expect(m.timeSelector.amPm).toBe("ص/م");
            expect(m.timeSelector.headerHours).toBe("الساعات");
            expect(m.timeSelector.headerMinutes).toBe("الدقائق");
            expect(m.timeSelector.headerSeconds).toBe("الثواني");
            expect(m.timeSelector.hours).toBe("الساعات");
            expect(m.timeSelector.minutes).toBe("الدقائق");
            expect(m.timeSelector.seconds).toBe("الثواني");
            expect(m.timeSelector.now).toBe("الآن");
            expect(m.timeSelector.set).toBe("تعيين");
            expect(m.timeSelector.timeSelector).toBe("منتقي الوقت");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor.bold).toBe("عريض");
            expect(m.editor.italic).toBe("مائل");
            expect(m.editor.underline).toBe("تسطير");
            expect(m.editor.strikethrough).toBe("يتوسطه خط");
            expect(m.editor.undo).toBe("تراجع");
            expect(m.editor.redo).toBe("إعادة");
            expect(m.editor.fontSize).toBe("حجم الخط");
            expect(m.editor.selectFontFamily).toBe("اختيار الخط");
            expect(m.editor.insertLink).toBe("إدراج رابط");
            expect(m.editor.insertImage).toBe("إدراج صورة");
            expect(m.editor.insertTable).toBe("إدراج جدول");
            expect(m.editor.alignCenter).toBe("توسيط");
            expect(m.editor.alignLeft).toBe("محاذاة إلى اليسار");
            expect(m.editor.alignRight).toBe("محاذاة إلى اليمين");
            expect(m.editor.enterUrl).toBe("إدخال عنوان URL");
            expect(m.editor.heightPx).toBe("الارتفاع (px)");
            expect(m.editor.widthPx).toBe("العرض (px)");
        });

        it("translates Chart financial and OHLC terminology correctly", () => {
            expect(m.chart.open).toBe("الافتتاح");
            expect(m.chart.high).toBe("الأعلى");
            expect(m.chart.low).toBe("الأدنى");
            expect(m.chart.close).toBe("الإغلاق");
            expect(m.chart.openAbbreviation).toBe("ا");
            expect(m.chart.highAbbreviation).toBe("ع");
            expect(m.chart.lowAbbreviation).toBe("د");
            expect(m.chart.closeAbbreviation).toBe("إ");
            expect(m.chart.chart).toBe("مخطط");
            expect(m.chart.chartLegend).toBe("وسيلة إيضاح المخطط");
            expect(m.chart.change).toBe("التغير");
            expect(m.chart.falling).toBe("هبوط");
            expect(m.chart.rising).toBe("صعود");
            expect(m.chart.unchanged).toBe("دون تغيير");
            expect(m.chart.noData).toBe("لا توجد بيانات متاحة");
            expect(m.chart.visualIndicatorClamped).toBe("تم تقييد المؤشر المرئي");
        });

        it("translates Dialog, Form, and Navigation components", () => {
            expect(m.dialog.ok).toBe("موافق");
            expect(m.dialog.cancel).toBe("إلغاء");
            expect(m.dialog.closeDialog).toBe("إغلاق مربع الحوار");
            expect(m.autoComplete.clear).toBe("مسح");
            expect(m.comboBox.clear).toBe("مسح");
            expect(m.dropdownList.clear).toBe("مسح");
            expect(m.textBox.clear).toBe("مسح");
            expect(m.multiSelect.clear).toBe("مسح");
            expect(m.breadcrumb.breadcrumb).toBe("مسار التنقل");
            expect(m.buttonGroup.buttonGroup).toBe("مجموعة أزرار");
            expect(m.datePicker.datePicker).toBe("منتقي التاريخ");
            expect(m.datePicker.openCalendar).toBe("فتح التقويم");
            expect(m.dateTimePicker.dateTimePicker).toBe("منتقي التاريخ والوقت");
            expect(m.timePicker.timePicker).toBe("منتقي الوقت");
            expect(m.card.actionsLabel).toBe("إجراءات البطاقة");
            expect(m.list.noData).toBe("لا توجد بيانات");
            expect(m.listBox.clearSelection).toBe("إلغاء التحديد");
            expect(m.numericTextBox.increase).toBe("زيادة القيمة");
            expect(m.numericTextBox.decrease).toBe("تقليل القيمة");
            expect(m.otpInput.verificationCode).toBe("رمز التحقق");
            expect(m.rating.notRated).toBe("غير مقيّم");
        });

        it("translates Window and Notification", () => {
            expect(m.window.close).toBe("إغلاق");
            expect(m.window.closeWindow).toBe("إغلاق النافذة");
            expect(m.window.maximize).toBe("تكبير");
            expect(m.window.minimize).toBe("تصغير");
            expect(m.window.restore).toBe("استعادة");
            expect(m.notification.error).toBe("خطأ");
            expect(m.notification.success).toBe("نجاح");
            expect(m.notification.warning).toBe("تحذير");
            expect(m.notification.info).toBe("معلومات");
        });

        it("translates TreeView, ScrollView, Spinner, Sheet, Splitter, Stepper, Tabs", () => {
            expect(m.treeView.expand).toBe("توسيع");
            expect(m.treeView.collapse).toBe("طي");
            expect(m.treeView.filter).toBe("تصفية:");
            expect(m.treeView.filterTree).toBe("تصفية طريقة عرض الشجرة");
            expect(m.scrollView.carousel).toBe("عرض دائري");
            expect(m.scrollView.slide).toBe("شريحة");
            expect(m.scrollView.nextPage).toBe("الصفحة التالية");
            expect(m.scrollView.previousPage).toBe("الصفحة السابقة");
            expect(m.scrollView.scrollPagerNext).toBe("تمرير مؤشر الصفحات إلى التالي");
            expect(m.scrollView.scrollPagerPrevious).toBe("تمرير مؤشر الصفحات إلى السابق");
            expect(m.spinner.loading).toBe("جارٍ التحميل");
            expect(m.spinner.cancel).toBe("إلغاء");
            expect(m.sheet.closeSheet).toBe("إغلاق اللوحة");
            expect(m.splitter.resizer).toBe("مقبض تغيير الحجم");
            expect(m.stepper.stepper).toBe("مؤشر الخطوات");
            expect(m.stepper.stepProgress).toBe("تقدم الخطوات");
            expect(m.tabs.closeTab).toBe("إغلاق علامة التبويب");
        });

        it("translates Filter, ColorGradient, Chip, SplitButton", () => {
            expect(m.filter.and).toBe("و");
            expect(m.filter.or).toBe("أو");
            expect(m.filter.apply).toBe("تطبيق");
            expect(m.filter.clear).toBe("مسح");
            expect(m.filter.contains).toBe("يحتوي على");
            expect(m.filter.doesNotContain).toBe("لا يحتوي على");
            expect(m.filter.isAfter).toBe("بعد");
            expect(m.filter.isAfterOrEqualTo).toBe("بعد أو يساوي");
            expect(m.filter.isBefore).toBe("قبل");
            expect(m.filter.isBeforeOrEqualTo).toBe("قبل أو يساوي");
            expect(m.filter.isEqualTo).toBe("يساوي");
            expect(m.filter.isNotEqualTo).toBe("لا يساوي");
            expect(m.filter.isNull).toBe("القيمة خالية");
            expect(m.filter.isNotNull).toBe("القيمة غير خالية");
            expect(m.filter.isEmpty).toBe("فارغ");
            expect(m.filter.isNotEmpty).toBe("غير فارغ");
            expect(m.filter.isNullOrEmpty).toBe("القيمة خالية أو فارغة");
            expect(m.filter.isNotNullOrEmpty).toBe("القيمة غير خالية وغير فارغة");
            expect(m.colorGradient.apply).toBe("تطبيق");
            expect(m.colorGradient.cancel).toBe("إلغاء");
            expect(m.chip.removeLabel("مشروع")).toBe("حذف مشروع");
            expect(m.chip.removeLabel()).toBe("حذف العنصر");
            expect(m.splitButton.menuButtonAriaLabel).toBe("عرض خيارات القائمة");
            expect(m.splitButton.splitButton("حفظ")).toBe("حفظ، زر تقسيم");
            expect(m.splitButton.splitButton("")).toBe("زر تقسيم");
        });
    });

    describe("function-valued message evaluation and Arabic digit formatting", () => {
        const m = MONA_AR_SA_LOCALE.messages;

        it("evaluates calendar function messages with Arabic-Indic digits", () => {
            expect(m.calendar.calendarLabel("سبتمبر ٢٠٢٦")).toBe("تقويم سبتمبر ٢٠٢٦");
            expect(m.calendar.yearViewLabel("٢٠٢٦")).toBe("عرض السنة، ٢٠٢٦");
            expect(m.calendar.decadeViewLabel(2020, 2029)).toBe("عرض العقد، من ٢٠٢٠ إلى ٢٠٢٩");
            expect(m.calendar.goToToday("١٥/٠٩/٢٠٢٦")).toBe("الانتقال إلى اليوم (١٥/٠٩/٢٠٢٦)");
            expect(m.calendar.switchToYearView("سبتمبر ٢٠٢٦")).toBe("التبديل إلى عرض السنة. الحالي سبتمبر ٢٠٢٦");
            expect(m.calendar.switchToDecadeView("٢٠٢٦")).toBe("التبديل إلى عرض العقد. السنة الحالية ٢٠٢٦");
            expect(m.calendar.decadeRange(2020, 2029)).toBe("من ٢٠٢٠ إلى ٢٠٢٩");
            expect(m.calendar.yearCellLabel(2026)).toBe("السنة ٢٠٢٦");

            // No Latin digits leaked
            expect(m.calendar.decadeRange(2020, 2029)).not.toMatch(/\d/);
            expect(m.calendar.yearCellLabel(2026)).not.toMatch(/\d/);
        });

        it("evaluates chart range descriptions with Arabic punctuation", () => {
            expect(m.chart.rangeDescription("المبيعات", "١٠", "١٠٠")).toBe("المبيعات، ١٠–١٠٠");
            expect(m.chart.divergingRangeDescription("الأرباح", "-٥٠", "٠", "١٠٠")).toBe("الأرباح، -٥٠ – ٠ – ١٠٠");
        });

        it("evaluates count-dependent messages with Arabic-Indic digits", () => {
            expect(m.dropdowns.resultsAvailable(5)).toBe("عدد النتائج المتاحة: ٥");
            expect(m.dropdowns.resultsAvailable(25)).toBe("عدد النتائج المتاحة: ٢٥");
            expect(m.multiSelect.itemsCount(3)).toBe("+ ٣");
            expect(m.grid.columnsSelected(4)).toBe("عدد الأعمدة المحددة: ٤");
            expect(m.grid.selectRow(3)).toBe("تحديد الصف ٣");
            expect(m.grid.reorderRow(2)).toBe("إعادة ترتيب الصف ٢");
            expect(m.editor.heading(2)).toBe("العنوان ٢");
            expect(m.scrollView.page(3)).toBe("الصفحة ٣");
            expect(m.scrollView.pageOf(3, 10)).toBe("الصفحة ٣ من ١٠");
        });

        it("evaluates Grid row reorder accessibility announcements", () => {
            const handleLabel = m.grid.rowReorderHandleAriaLabel("الصف ١", "استخدم Alt + سهم لأعلى أو Alt + سهم لأسفل للتحريك.");
            expect(handleLabel).toBe("الصف ١. استخدم Alt + سهم لأعلى أو Alt + سهم لأسفل للتحريك.");

            const disabledHandle = m.grid.rowReorderHandleAriaLabel("الصف ١", "استخدم مفاتيح الأسهم للتحريك.", "إعادة ترتيب الصفوف غير متاح.");
            expect(disabledHandle).toBe("الصف ١. استخدم مفاتيح الأسهم للتحريك. إعادة ترتيب الصفوف غير متاح.");

            expect(m.grid.rowReorderMoved(3, 1)).toBe("تم نقل الصف ٣ إلى الموضع ١.");
        });

        it("evaluates ColorGradient accessibility label with Arabic digits and percent sign", () => {
            expect(m.colorGradient.saturationAndValueText(80, 50)).toBe("التشبع ٨٠٪، القيمة ٥٠٪");
            expect(m.colorGradient.saturationAndValueText(80, 50)).not.toMatch(/\d/);
            expect(m.colorGradient.saturationAndValueText(80, 50)).toContain("٪");
        });

        it("evaluates Rating value text across scale levels", () => {
            expect(m.rating.valueText(4, 5)).toBe("٤ من ٥");
            expect(m.rating.valueText(0, 10)).toBe("٠ من ١٠");
            expect(m.rating.valueText(1, 1)).toBe("١ من ١");
        });
    });

    describe("Arabic plural category coverage (zero, one, two, few, many, other)", () => {
        const m = MONA_AR_SA_LOCALE.messages;

        it("covers all 6 plural categories and boundary transitions in Pager jump labels", () => {
            const expectations: Record<number, { backward: string; forward: string }> = {
                0: { backward: "للخلف: ٠ صفحات", forward: "للأمام: ٠ صفحات" },
                1: { backward: "للخلف: صفحة واحدة", forward: "للأمام: صفحة واحدة" },
                2: { backward: "للخلف: صفحتان", forward: "للأمام: صفحتان" },
                3: { backward: "للخلف: ٣ صفحات", forward: "للأمام: ٣ صفحات" },
                5: { backward: "للخلف: ٥ صفحات", forward: "للأمام: ٥ صفحات" },
                10: { backward: "للخلف: ١٠ صفحات", forward: "للأمام: ١٠ صفحات" },
                11: { backward: "للخلف: ١١ صفحة", forward: "للأمام: ١١ صفحة" },
                12: { backward: "للخلف: ١٢ صفحة", forward: "للأمام: ١٢ صفحة" },
                99: { backward: "للخلف: ٩٩ صفحة", forward: "للأمام: ٩٩ صفحة" },
                100: { backward: "للخلف: ١٠٠ صفحة", forward: "للأمام: ١٠٠ صفحة" },
                101: { backward: "للخلف: ١٠١ صفحة", forward: "للأمام: ١٠١ صفحة" },
                102: { backward: "للخلف: ١٠٢ صفحة", forward: "للأمام: ١٠٢ صفحة" },
                103: { backward: "للخلف: ١٠٣ صفحات", forward: "للأمام: ١٠٣ صفحات" },
                111: { backward: "للخلف: ١١١ صفحة", forward: "للأمام: ١١١ صفحة" }
            };

            for (const [countStr, expected] of Object.entries(expectations)) {
                const count = Number(countStr);
                expect(m.pager.jumpBackwardLabel(count), `count ${count} backward`).toBe(expected.backward);
                expect(m.pager.jumpForwardLabel(count), `count ${count} forward`).toBe(expected.forward);
            }
        });
    });

    describe("arbitrary-label safety tests across diverse scripts and shapes", () => {
        const m = MONA_AR_SA_LOCALE.messages;

        const testLabels = [
            "المشروع",
            "البريد",
            "Angular",
            "2026",
            "A/B",
            "ملف 1"
        ];

        it("chip removeLabel is safe for diverse labels without gender guessing", () => {
            for (const label of testLabels) {
                const result = m.chip.removeLabel(label);
                expect(result).toBe(`حذف ${label}`);
            }
            expect(m.chip.removeLabel()).toBe("حذف العنصر");
            expect(m.chip.removeLabel("")).toBe("حذف العنصر");
        });

        it("grid filterByColumn is parameter-neutral for diverse columns", () => {
            for (const col of testLabels) {
                const result = m.grid.filterByColumn(col);
                expect(result).toBe(`التصفية حسب: ${col}`);
            }
        });

        it("splitButton is parameter-neutral for diverse texts", () => {
            for (const text of testLabels) {
                const result = m.splitButton.splitButton(text);
                expect(result).toBe(`${text}، زر تقسيم`);
            }
            expect(m.splitButton.splitButton("")).toBe("زر تقسيم");
            expect(m.splitButton.splitButton(undefined)).toBe("زر تقسيم");
        });

        it("chart rangeDescription is parameter-neutral for diverse titles", () => {
            for (const title of testLabels) {
                const result = m.chart.rangeDescription(title, "٠", "١٠٠");
                expect(result).toBe(`${title}، ٠–١٠٠`);
            }
        });

        it("dropdowns itemPosition is parameter-neutral for diverse items", () => {
            for (const text of testLabels) {
                const result = m.dropdowns.itemPosition(text, 1, 5);
                expect(result).toBe(`${text}، العنصر ١ من ٥`);
            }
        });
    });
});
