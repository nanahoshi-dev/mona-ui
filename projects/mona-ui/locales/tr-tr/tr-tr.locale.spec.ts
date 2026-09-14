import { describe, expect, it } from "vitest";
import { MONA_TR_TR_LOCALE } from "./tr-tr.locale";
import { TR_TR_MESSAGES } from "./tr-tr.messages";

describe("MONA_TR_TR_LOCALE", () => {
    describe("metadata", () => {
        it("declares tr-TR locale id", () => {
            expect(MONA_TR_TR_LOCALE.id).toBe("tr-TR");
            expect(MONA_TR_TR_LOCALE.id).not.toBe("tr");
            expect(MONA_TR_TR_LOCALE.id).not.toBe("tr_TR");
            expect(MONA_TR_TR_LOCALE.id).not.toBe("tr-tr");
        });

        it("canonicalizes to tr-TR via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_TR_TR_LOCALE.id)[0]).toBe("tr-TR");
        });

        it("declares ltr direction", () => {
            expect(MONA_TR_TR_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to TR_TR_MESSAGES", () => {
            expect(MONA_TR_TR_LOCALE.messages).toBe(TR_TR_MESSAGES);
            expect(typeof MONA_TR_TR_LOCALE.messages).toBe("object");
        });
    });

    describe("completeness", () => {
        it("defines message namespaces without empty sections", () => {
            const namespaces = Object.keys(MONA_TR_TR_LOCALE.messages);
            expect(namespaces.length).toBeGreaterThan(0);
            for (const ns of namespaces) {
                const section = (MONA_TR_TR_LOCALE.messages as Record<string, unknown>)[ns];
                expect(typeof section).toBe("object");
                expect(section).not.toBeNull();
                expect(Object.keys(section as object).length).toBeGreaterThan(0);
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_TR_TR_LOCALE.messages;

        it("translates Pager messages correctly with Turkish terminology", () => {
            expect(m.pager?.firstPageLabel).toBe("İlk sayfa");
            expect(m.pager?.lastPageLabel).toBe("Son sayfa");
            expect(m.pager?.nextPageLabel).toBe("Sonraki sayfa");
            expect(m.pager?.previousPageLabel).toBe("Önceki sayfa");
            expect(m.pager?.ofText).toBe("/");
            expect(m.pager?.pageText).toBe("Sayfa");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("Sayfa başına 10");
        });

        it("translates Grid messages correctly with Turkish terminology", () => {
            expect(m.grid?.all).toBe("(Tümü)");
            expect(m.grid?.delete).toBe("Sil");
            expect(m.grid?.deleteRowConfirmation).toBe("Bu öğeyi silmek istediğinizden emin misiniz?");
            expect(m.grid?.deleteRowTitle).toBe("Satır silinsin mi?");
            expect(m.grid?.edit).toBe("Düzenle");
            expect(m.grid?.filterPlaceholder).toBe("Filtrele...");
            expect(m.grid?.moveRow).toBe("Satırı taşı");
            expect(m.grid?.noData).toBe("Veri yok");
            expect(m.grid?.moveAsNext).toBe("Sonrasına taşı");
            expect(m.grid?.moveAsPrevious).toBe("Öncesine taşı");
            expect(m.grid?.remove).toBe("Kaldır");
            expect(m.grid?.rowReorder).toBe("Satırları yeniden sırala");
            expect(m.grid?.save).toBe("Kaydet");
            expect(m.grid?.selectAllRows).toBe("Tüm satırları seç");
        });

        it("translates ListBox messages correctly with accessible descriptive labels", () => {
            expect(m.listBox?.clearSelection).toBe("Tüm seçimleri kaldır");
            expect(m.listBox?.moveDown).toBe("Aşağı taşı");
            expect(m.listBox?.moveUp).toBe("Yukarı taşı");
            expect(m.listBox?.remove).toBe("Kaldır");
            expect(m.listBox?.transferFrom).toBe("Diğer listeden taşı");
            expect(m.listBox?.transferTo).toBe("Diğer listeye taşı");
            expect(m.listBox?.transferAllFrom).toBe("Tümünü diğer listeden taşı");
            expect(m.listBox?.transferAllTo).toBe("Tümünü diğer listeye taşı");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Kalın");
            expect(m.editor?.italic).toBe("İtalik");
            expect(m.editor?.underline).toBe("Altı çizili");
            expect(m.editor?.strikethrough).toBe("Üstü çizili");
            expect(m.editor?.insertLink).toBe("Bağlantı ekle");
            expect(m.editor?.removeLink).toBe("Bağlantıyı kaldır");
            expect(m.editor?.codeBlock).toBe("Kod bloğu");
            expect(m.editor?.quotation).toBe("Alıntı");
            expect(m.editor?.undo).toBe("Geri al");
            expect(m.editor?.redo).toBe("Yinele");
            expect(m.editor?.alignCenter).toBe("Ortala");
            expect(m.editor?.insertTable).toBe("Tablo ekle");
            expect(m.editor?.deleteTable).toBe("Tabloyu sil");
            expect(m.editor?.format).toBe("Biçim");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Bugün");
            expect(m.calendar?.nextMonth).toBe("Sonraki ay");
            expect(m.calendar?.previousMonth).toBe("Önceki ay");
            expect(m.calendar?.nextYear).toBe("Sonraki yıl");
            expect(m.calendar?.previousYear).toBe("Önceki yıl");
            expect(m.calendar?.nextDecade).toBe("Sonraki on yıl");
            expect(m.calendar?.previousDecade).toBe("Önceki on yıl");
            expect(m.datePicker?.datePicker).toBe("Tarih seçici");
            expect(m.datePicker?.openCalendar).toBe("Takvimi aç");
        });

        it("translates TimeSelector & TimePicker messages correctly with native Turkish day periods", () => {
            expect(m.timeSelector?.am).toBe("ÖÖ");
            expect(m.timeSelector?.pm).toBe("ÖS");
            expect(m.timeSelector?.amPm).toBe("ÖÖ/ÖS");
            expect(m.timeSelector?.timeSelector).toBe("Saat seçici");
            expect(m.timeSelector?.now).toBe("Şimdi");
            expect(m.timeSelector?.set).toBe("Ayarla");
            expect(m.timePicker?.timePicker).toBe("Saat seçici");
            expect(m.timePicker?.openTimePicker).toBe("Saat seçiciyi aç");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Değeri azalt");
            expect(m.numericTextBox?.increase).toBe("Değeri artır");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Temizle");
            expect(m.dropdownList?.clear).toBe("Temizle");
            expect(m.dropdowns?.noResultsFound).toBe("Sonuç bulunamadı");
        });

        it("translates Dialog & Window messages correctly using Tamam instead of OK", () => {
            expect(m.dialog?.ok).toBe("Tamam");
            expect(m.dialog?.cancel).toBe("İptal");
            expect(m.dialog?.closeDialog).toBe("İletişim kutusunu kapat");
            expect(m.window?.close).toBe("Kapat");
            expect(m.window?.closeWindow).toBe("Pencereyi kapat");
            expect(m.window?.maximize).toBe("Ekranı kapla");
            expect(m.window?.minimize).toBe("Simge durumuna küçült");
            expect(m.window?.restore).toBe("Geri yükle");
            expect(m.window?.moveWindow).toBe("Pencereyi taşı. Taşımak için ok tuşlarını kullanın.");
            expect(m.window?.resizeTop).toBe(
                "Pencereyi üst kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın."
            );
            expect(m.window?.resizeBottom).toBe(
                "Pencereyi alt kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın."
            );
            expect(m.window?.resizeLeft).toBe(
                "Pencereyi sol kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın."
            );
            expect(m.window?.resizeRight).toBe(
                "Pencereyi sağ kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın."
            );
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("Daralt");
            expect(m.treeView?.expand).toBe("Genişlet");
            expect(m.treeView?.filterTree).toBe("Ağacı filtrele");
            expect(m.list?.noData).toBe("Veri yok");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("atlıkarınca");
            expect(m.scrollView?.slide).toBe("slayt");
            expect(m.scrollView?.nextPage).toBe("Sonraki sayfa");
            expect(m.scrollView?.previousPage).toBe("Önceki sayfa");
            expect(m.scrollView?.scrollPagerNext).toBe("Sayfalama seçeneklerini ileri kaydır");
            expect(m.scrollView?.scrollPagerPrevious).toBe("Sayfalama seçeneklerini geri kaydır");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("Yükleniyor");
            expect(m.spinner?.cancel).toBe("İptal");
            expect(m.notification?.close).toBe("Kapat");
            expect(m.notification?.success).toBe("Başarılı");
            expect(m.notification?.error).toBe("Hata");
            expect(m.notification?.warning).toBe("Uyarı");
            expect(m.notification?.info).toBe("Bilgi");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("Paneli kapat");
            expect(m.splitter?.resizer).toBe("Panel ayırıcı");
            expect(m.splitter?.collapsePrevious).toBe("Önceki paneli daralt");
            expect(m.splitter?.collapseNext).toBe("Sonraki paneli daralt");
            expect(m.splitter?.collapseUp).toBe("Üst paneli daralt");
            expect(m.splitter?.collapseDown).toBe("Alt paneli daralt");
            expect(m.stepper?.stepProgress).toBe("Adım ilerlemesi");
            expect(m.stepper?.stepper).toBe("Adımlar");
            expect(m.tabs?.closeTab).toBe("Sekmeyi kapat");
        });

        it("translates Filter date, boolean, and null operators correctly", () => {
            expect(m.filter?.isAfter).toBe("Daha sonra");
            expect(m.filter?.isAfterOrEqualTo).toBe("Eşit veya daha sonra");
            expect(m.filter?.isBefore).toBe("Daha önce");
            expect(m.filter?.isBeforeOrEqualTo).toBe("Eşit veya daha önce");
            expect(m.filter?.isEqualTo).toBe("Eşittir");
            expect(m.filter?.isNotEqualTo).toBe("Eşit değildir");
            expect(m.filter?.isNull).toBe("Null'dır");
            expect(m.filter?.isNotNull).toBe("Null değildir");
            expect(m.filter?.isTrue).toBe("Doğrudur");
            expect(m.filter?.isFalse).toBe("Yanlıştır");
            expect(m.filter?.contains).toBe("İçerir");
            expect(m.filter?.doesNotContain).toBe("İçermez");
            expect(m.filter?.startsWith).toBe("İle başlar");
            expect(m.filter?.endsWith).toBe("İle biter");
        });

        it("translates Breadcrumb messages correctly with Turkish accessibility terminology", () => {
            expect(m.breadcrumb?.breadcrumb).toBe("İçerik haritası");
        });

        it("translates SplitButton menu toggle message correctly", () => {
            expect(m.splitButton?.menuButtonAriaLabel).toBe("Menü seçeneklerini göster");
        });

        it("translates ColorGradient accessibility labels correctly", () => {
            expect(m.colorGradient?.saturationAndValue).toBe("Renk doygunluğu ve değeri");
        });

        it("translates Grid row-reorder disabled reasons correctly", () => {
            expect(m.grid?.rowReorderDisabled).toBe("Satırları yeniden sıralama devre dışı.");
            expect(m.grid?.rowReorderDisabledEditing).toBe(
                "Satırları yeniden sıralamadan önce düzenlemeyi tamamlayın."
            );
            expect(m.grid?.rowReorderDisabledFiltered).toBe(
                "Satırları yeniden sıralamadan önce filtreleri kaldırın."
            );
            expect(m.grid?.rowReorderDisabledGrouped).toBe(
                "Satırları yeniden sıralamadan önce gruplamayı kaldırın."
            );
            expect(m.grid?.rowReorderDisabledSingleRow).toBe(
                "Yeniden sıralamak için en az iki satır gerekir."
            );
            expect(m.grid?.rowReorderDisabledSorted).toBe(
                "Satırları yeniden sıralamadan önce sıralamayı kaldırın."
            );
            expect(m.grid?.rowReorderDisabledVirtualScroll).toBe(
                "Sanal kaydırma etkinken satırlar yeniden sıralanamaz."
            );
            expect(m.grid?.rowReorderKeyboardHint).toBe(
                "Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın."
            );
        });

        it("preserves Turkish specific characters without ASCII degradation", () => {
            expect(m.dialog?.cancel).toContain("İ");
            expect(m.grid?.all).toContain("ü");
            expect(m.grid?.delete).toContain("i");
            expect(m.editor?.underline).toContain("ı");
            expect(m.timeSelector?.am).toContain("Ö");
            expect(m.notification?.success).toContain("ş");
            expect(m.buttonGroup?.buttonGroup).toContain("ğ");
            expect(m.editor?.strikethrough).toContain("ç");
            expect(m.treeView?.expand).toContain("ş");
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_TR_TR_LOCALE.messages;

        it("formats Calendar functions correctly with natural Turkish date composition", () => {
            expect(m.calendar?.calendarLabel?.("Eylül 2026")).toBe("Takvim, Eylül 2026");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020 - 2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("On yıllık görünüm, 2020 - 2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("2026 yılı");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Yıl görünümü, 2026");
            expect(m.calendar?.goToToday?.("15.09.2026")).toBe("Bugüne git, 15.09.2026");
            expect(m.calendar?.switchToYearView?.("Eylül 2026")).toBe(
                "Yıl görünümüne geç, şu anda Eylül 2026"
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "On yıllık görünüme geç, şu anda 2026"
            );
        });

        it("formats Chart functions and preserves Turkish financial terminology", () => {
            expect(m.chart?.open).toBe("Açılış");
            expect(m.chart?.high).toBe("En yüksek");
            expect(m.chart?.low).toBe("En düşük");
            expect(m.chart?.close).toBe("Kapanış");
            expect(m.chart?.openAbbreviation).toBe("A");
            expect(m.chart?.highAbbreviation).toBe("Y");
            expect(m.chart?.lowAbbreviation).toBe("D");
            expect(m.chart?.closeAbbreviation).toBe("K");
            expect(m.chart?.rangeDescription?.("Gelir", "0", "100")).toBe("Gelir, 0 ile 100 arasında");
            expect(m.chart?.divergingRangeDescription?.("Kârlılık", "-10", "0", "+10")).toBe(
                "Kârlılık, -10 ile +10 arasında, orta değer 0"
            );
        });

        it("formats Chip removeLabel function correctly for both labelled and unlabelled cases", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Angular öğesini kaldır");
            expect(m.chip?.removeLabel?.()).toBe("Öğeyi kaldır");
            expect(m.chip?.removeLabel?.("")).toBe("Öğeyi kaldır");
        });

        it("formats ColorGradient saturationAndValueText function correctly using % placement", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("Doygunluk %50, değer %75");
        });

        it("formats ColorPalette color function correctly", () => {
            expect(m.colorPalette?.color?.("#FF00AA")).toBe("Renk: #FF00AA");
        });

        it("formats Dropdowns functions with singular counted nouns across 0, 1, 2, 10 counts", () => {
            expect(m.dropdowns?.itemPosition?.("Seçenek 1", 1, 10)).toBe("Seçenek 1, 10 öğeden 1.");
            expect(m.dropdowns?.resultsAvailable?.(0)).toBe("0 sonuç bulundu");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1 sonuç bulundu");
            expect(m.dropdowns?.resultsAvailable?.(2)).toBe("2 sonuç bulundu");
            expect(m.dropdowns?.resultsAvailable?.(10)).toBe("10 sonuç bulundu");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Başlık 1");
            expect(m.editor?.heading?.(3)).toBe("Başlık 3");
        });

        it("formats Grid functions correctly with singular counted nouns across 0, 1, 2, 10 counts", () => {
            expect(m.grid?.columnsSelected?.(0)).toBe("0 sütun seçildi");
            expect(m.grid?.columnsSelected?.(1)).toBe("1 sütun seçildi");
            expect(m.grid?.columnsSelected?.(2)).toBe("2 sütun seçildi");
            expect(m.grid?.columnsSelected?.(10)).toBe("10 sütun seçildi");
            expect(m.grid?.filterByColumn?.("Ad")).toBe("Ad sütununa göre filtrele");
            expect(m.grid?.reorderRow?.(4)).toBe("4. satırı yeniden sırala");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "1. satır",
                    "Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın."
                )
            ).toBe("1. satır. Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın.");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "1. satır",
                    "Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın.",
                    "Satırları yeniden sıralama devre dışı."
                )
            ).toBe(
                "1. satır. Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın. Satırları yeniden sıralama devre dışı."
            );
            expect(m.grid?.rowReorderMoved?.(3, 2)).toBe("3. satır 2. konuma taşındı.");
            expect(m.grid?.selectRow?.(2)).toBe("2. satırı seç");
        });

        it("formats MultiSelect itemsCount function without plural suffix across 0, 1, 2, 10 counts", () => {
            expect(m.multiSelect?.itemsCount?.(0)).toBe("+ 0 öğe");
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1 öğe");
            expect(m.multiSelect?.itemsCount?.(2)).toBe("+ 2 öğe");
            expect(m.multiSelect?.itemsCount?.(10)).toBe("+ 10 öğe");
        });

        it("formats Pager functions correctly without plural suffix across 0, 1, 2, 10 counts", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("3. sayfa");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("Sayfa başına 10");
            expect(m.pager?.pageStatus?.(1, 1)).toBe("Sayfa 1 / 1");
            expect(m.pager?.pageStatus?.(1, 2)).toBe("Sayfa 1 / 2");
            expect(m.pager?.pageStatus?.(2, 10)).toBe("Sayfa 2 / 10");
            expect(m.pager?.jumpBackwardLabel?.(0)).toBe("0 sayfa geri git");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("1 sayfa geri git");
            expect(m.pager?.jumpBackwardLabel?.(2)).toBe("2 sayfa geri git");
            expect(m.pager?.jumpBackwardLabel?.(10)).toBe("10 sayfa geri git");
            expect(m.pager?.jumpForwardLabel?.(0)).toBe("0 sayfa ileri git");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("1 sayfa ileri git");
            expect(m.pager?.jumpForwardLabel?.(2)).toBe("2 sayfa ileri git");
            expect(m.pager?.jumpForwardLabel?.(10)).toBe("10 sayfa ileri git");
        });

        it("formats Pager rangeStatus with singular noun without plural branching", () => {
            expect(m.pager?.rangeStatus?.(0, 0, 0)).toBe("0 - 0 / 0 öğe");
            expect(m.pager?.rangeStatus?.(1, 1, 1)).toBe("1 - 1 / 1 öğe");
            expect(m.pager?.rangeStatus?.(1, 2, 2)).toBe("1 - 2 / 2 öğe");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1 - 10 / 50 öğe");
            expect(m.pager?.rangeStatus?.(1, 20, 100)).toBe("1 - 20 / 100 öğe");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("5 üzerinden 4");
        });

        it("formats ScrollView page functions correctly", () => {
            expect(m.scrollView?.page?.(1)).toBe("1. sayfa");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("Sayfa 2 / 8");
        });

        it("formats SplitButton function correctly for both text and empty states", () => {
            expect(m.splitButton?.splitButton?.("Kaydet")).toBe("Kaydet, bölünmüş düğme");
            expect(m.splitButton?.splitButton?.("")).toBe("Bölünmüş düğme");
        });
    });
});
