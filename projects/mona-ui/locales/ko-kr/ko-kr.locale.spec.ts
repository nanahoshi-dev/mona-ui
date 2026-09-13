import { describe, expect, it } from "vitest";
import { MONA_KO_KR_LOCALE } from "./ko-kr.locale";
import { KO_KR_MESSAGES } from "./ko-kr.messages";

describe("MONA_KO_KR_LOCALE", () => {
    describe("metadata", () => {
        it("declares ko-KR locale id", () => {
            expect(MONA_KO_KR_LOCALE.id).toBe("ko-KR");
        });

        it("canonicalizes to ko-KR via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_KO_KR_LOCALE.id)[0]).toBe("ko-KR");
        });

        it("declares ltr direction", () => {
            expect(MONA_KO_KR_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to KO_KR_MESSAGES", () => {
            expect(MONA_KO_KR_LOCALE.messages).toBe(KO_KR_MESSAGES);
            expect(typeof MONA_KO_KR_LOCALE.messages).toBe("object");
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
                expect(MONA_KO_KR_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_KO_KR_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager.firstPageLabel).toBe("첫 페이지");
            expect(m.pager.lastPageLabel).toBe("마지막 페이지");
            expect(m.pager.nextPageLabel).toBe("다음 페이지");
            expect(m.pager.previousPageLabel).toBe("이전 페이지");
            expect(m.pager.ofText).toBe("/");
            expect(m.pager.pageText).toBe("페이지");
            expect(m.pager.pageSizeLabel(10)).toBe("페이지당 10개");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid.all).toBe("(모두)");
            expect(m.grid.delete).toBe("삭제");
            expect(m.grid.deleteRowConfirmation).toBe("이 항목을 삭제하시겠습니까?");
            expect(m.grid.deleteRowTitle).toBe("행 삭제?");
            expect(m.grid.edit).toBe("편집");
            expect(m.grid.filterPlaceholder).toBe("필터…");
            expect(m.grid.noData).toBe("데이터 없음");
            expect(m.grid.moveAsNext).toBe("다음 항목으로 이동");
            expect(m.grid.moveAsPrevious).toBe("이전 항목으로 이동");
            expect(m.grid.remove).toBe("제거");
            expect(m.grid.save).toBe("저장");
            expect(m.grid.columns).toBe("열");
            expect(m.grid.cancelRowEdit).toBe("행 편집 취소");
            expect(m.grid.dragColumnHeaderToGroup).toBe("열 머리글을 여기에 끌어놓아 그룹화하세요");
            expect(m.grid.rowReorder).toBe("행 순서 변경");
            expect(m.grid.selectAllRows).toBe("모든 행 선택");
        });

        it("translates Calendar messages correctly", () => {
            expect(m.calendar.today).toBe("오늘");
            expect(m.calendar.nextMonth).toBe("다음 달");
            expect(m.calendar.previousMonth).toBe("이전 달");
            expect(m.calendar.nextYear).toBe("다음 연도");
            expect(m.calendar.previousYear).toBe("이전 연도");
            expect(m.calendar.nextDecade).toBe("다음 10년");
            expect(m.calendar.previousDecade).toBe("이전 10년");
        });

        it("translates TimeSelector messages correctly", () => {
            expect(m.timeSelector.am).toBe("오전");
            expect(m.timeSelector.pm).toBe("오후");
            expect(m.timeSelector.amPm).toBe("오전/오후");
            expect(m.timeSelector.headerHours).toBe("시");
            expect(m.timeSelector.headerMinutes).toBe("분");
            expect(m.timeSelector.headerSeconds).toBe("초");
            expect(m.timeSelector.hours).toBe("시");
            expect(m.timeSelector.minutes).toBe("분");
            expect(m.timeSelector.seconds).toBe("초");
            expect(m.timeSelector.now).toBe("현재 시간");
            expect(m.timeSelector.set).toBe("설정");
            expect(m.timeSelector.timeSelector).toBe("시간 선택기");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor.bold).toBe("굵게");
            expect(m.editor.italic).toBe("기울임꼴");
            expect(m.editor.underline).toBe("밑줄");
            expect(m.editor.strikethrough).toBe("취소선");
            expect(m.editor.undo).toBe("실행 취소");
            expect(m.editor.redo).toBe("다시 실행");
            expect(m.editor.fontSize).toBe("글꼴 크기");
            expect(m.editor.selectFontFamily).toBe("글꼴 선택");
            expect(m.editor.insertLink).toBe("링크 삽입");
            expect(m.editor.insertImage).toBe("이미지 삽입");
            expect(m.editor.insertTable).toBe("표 삽입");
            expect(m.editor.alignCenter).toBe("가운데 맞춤");
            expect(m.editor.enterUrl).toBe("URL 입력");
            expect(m.editor.heightPx).toBe("높이 (px)");
            expect(m.editor.widthPx).toBe("너비 (px)");
        });

        it("translates Chart financial and OHLC terminology correctly", () => {
            expect(m.chart.open).toBe("시가");
            expect(m.chart.high).toBe("고가");
            expect(m.chart.low).toBe("저가");
            expect(m.chart.close).toBe("종가");
            expect(m.chart.openAbbreviation).toBe("시");
            expect(m.chart.highAbbreviation).toBe("고");
            expect(m.chart.lowAbbreviation).toBe("저");
            expect(m.chart.closeAbbreviation).toBe("종");
            expect(m.chart.chart).toBe("차트");
            expect(m.chart.chartLegend).toBe("차트 범례");
            expect(m.chart.change).toBe("변동");
            expect(m.chart.falling).toBe("하락");
            expect(m.chart.rising).toBe("상승");
            expect(m.chart.unchanged).toBe("변동 없음");
            expect(m.chart.noData).toBe("사용 가능한 데이터 없음");
            expect(m.chart.visualIndicatorClamped).toBe("시각 표시기가 제한됨");
        });

        it("translates Dialog, Form, and Navigation components", () => {
            expect(m.dialog.ok).toBe("확인");
            expect(m.dialog.cancel).toBe("취소");
            expect(m.dialog.closeDialog).toBe("대화 상자 닫기");
            expect(m.autoComplete.clear).toBe("지우기");
            expect(m.comboBox.clear).toBe("지우기");
            expect(m.dropdownList.clear).toBe("지우기");
            expect(m.textBox.clear).toBe("지우기");
            expect(m.multiSelect.clear).toBe("지우기");
            expect(m.breadcrumb.breadcrumb).toBe("이동 경로");
            expect(m.buttonGroup.buttonGroup).toBe("버튼 그룹");
            expect(m.datePicker.datePicker).toBe("날짜 선택기");
            expect(m.datePicker.openCalendar).toBe("달력 열기");
            expect(m.dateTimePicker.dateTimePicker).toBe("날짜/시간 선택기");
            expect(m.timePicker.timePicker).toBe("시간 선택기");
            expect(m.card.actionsLabel).toBe("카드 작업");
            expect(m.list.noData).toBe("데이터 없음");
            expect(m.listBox.clearSelection).toBe("선택 해제");
            expect(m.numericTextBox.increase).toBe("값 늘리기");
            expect(m.numericTextBox.decrease).toBe("값 줄이기");
            expect(m.otpInput.verificationCode).toBe("인증 코드");
            expect(m.rating.notRated).toBe("평가되지 않음");
        });

        it("translates Window and Notification", () => {
            expect(m.window.close).toBe("닫기");
            expect(m.window.closeWindow).toBe("창 닫기");
            expect(m.window.maximize).toBe("최대화");
            expect(m.window.minimize).toBe("최소화");
            expect(m.window.restore).toBe("복원");
            expect(m.notification.error).toBe("오류");
            expect(m.notification.success).toBe("성공");
            expect(m.notification.warning).toBe("경고");
            expect(m.notification.info).toBe("정보");
        });

        it("translates TreeView, ScrollView, Spinner, Sheet, Splitter, Stepper, Tabs", () => {
            expect(m.treeView.expand).toBe("확장");
            expect(m.treeView.collapse).toBe("축소");
            expect(m.treeView.filter).toBe("필터:");
            expect(m.treeView.filterTree).toBe("트리 뷰 필터");
            expect(m.scrollView.carousel).toBe("캐러셀");
            expect(m.scrollView.slide).toBe("슬라이드");
            expect(m.scrollView.nextPage).toBe("다음 페이지");
            expect(m.scrollView.previousPage).toBe("이전 페이지");
            expect(m.scrollView.scrollPagerNext).toBe("페이지 표시기 다음으로 스크롤");
            expect(m.scrollView.scrollPagerPrevious).toBe("페이지 표시기 이전으로 스크롤");
            expect(m.spinner.loading).toBe("로딩 중");
            expect(m.spinner.cancel).toBe("취소");
            expect(m.sheet.closeSheet).toBe("시트 닫기");
            expect(m.splitter.resizer).toBe("크기 조정 핸들");
            expect(m.stepper.stepper).toBe("단계 표시기");
            expect(m.stepper.stepProgress).toBe("단계 진행률");
            expect(m.tabs.closeTab).toBe("탭 닫기");
        });

        it("translates Filter, ColorGradient, Chip, SplitButton", () => {
            expect(m.filter.and).toBe("그리고");
            expect(m.filter.or).toBe("또는");
            expect(m.filter.apply).toBe("적용");
            expect(m.filter.clear).toBe("지우기");
            expect(m.filter.contains).toBe("포함");
            expect(m.filter.doesNotContain).toBe("포함하지 않음");
            expect(m.filter.isAfter).toBe("보다 이후");
            expect(m.filter.isAfterOrEqualTo).toBe("이후 또는 같음");
            expect(m.filter.isBefore).toBe("보다 이전");
            expect(m.filter.isBeforeOrEqualTo).toBe("이전 또는 같음");
            expect(m.filter.isEqualTo).toBe("같음");
            expect(m.filter.isNotEqualTo).toBe("같지 않음");
            expect(m.colorGradient.apply).toBe("적용");
            expect(m.colorGradient.cancel).toBe("취소");
            expect(m.chip.removeLabel("라벨")).toBe("라벨 삭제");
            expect(m.chip.removeLabel()).toBe("항목 삭제");
            expect(m.splitButton.menuButtonAriaLabel).toBe("메뉴 옵션 표시");
            expect(m.splitButton.splitButton("저장")).toBe("저장, 분할 버튼");
            expect(m.splitButton.splitButton("")).toBe("분할 버튼");
        });
    });

    describe("function-valued message evaluation and parameter composition", () => {
        const m = MONA_KO_KR_LOCALE.messages;

        it("evaluates calendar function messages without duplicate year suffixes", () => {
            expect(m.calendar.calendarLabel("2026년 9월")).toBe("2026년 9월 달력");
            expect(m.calendar.yearViewLabel("2026년")).toBe("연도 보기, 2026년");
            expect(m.calendar.decadeViewLabel(2020, 2029)).toBe("10년 보기, 2020년~2029년");
            expect(m.calendar.goToToday("2026년 9월 15일")).toBe("오늘로 이동 (2026년 9월 15일)");
            expect(m.calendar.switchToYearView("2026년 9월")).toBe("연도 보기로 전환. 현재 2026년 9월");
            expect(m.calendar.switchToDecadeView("2026년")).toBe("10년 보기로 전환. 현재 2026년");
            expect(m.calendar.decadeRange(2020, 2029)).toBe("2020년~2029년");
            expect(m.calendar.yearCellLabel(2026)).toBe("2026년");

            // Suffix check: no duplicate year/month suffixes
            expect(m.calendar.calendarLabel("2026년 9월")).not.toContain("년년");
            expect(m.calendar.calendarLabel("2026년 9월")).not.toContain("월월");
            expect(m.calendar.yearViewLabel("2026년")).not.toContain("년년");
            expect(m.calendar.decadeRange(2020, 2029)).not.toContain("년년");
        });

        it("evaluates chart range descriptions", () => {
            expect(m.chart.rangeDescription("매출", "10", "100")).toBe("매출, 10~100");
            expect(m.chart.divergingRangeDescription("수익", "-50", "0", "100")).toBe("수익, -50 ~ 0 ~ 100");
        });

        it("evaluates count-dependent messages with stable Korean grammar", () => {
            const counts = [0, 1, 2, 5, 10];
            for (const count of counts) {
                expect(m.dropdowns.resultsAvailable(count)).toBe(`사용 가능한 결과 ${count}개`);
                expect(m.multiSelect.itemsCount(count)).toBe(`+ ${count}개`);
                expect(m.grid.columnsSelected(count)).toBe(`선택한 열: ${count}개`);
                expect(m.pager.jumpBackwardLabel(count)).toBe(`${count}페이지 뒤로`);
                expect(m.pager.jumpForwardLabel(count)).toBe(`${count}페이지 앞으로`);
                expect(m.pager.pageSizeLabel(count)).toBe(`페이지당 ${count}개`);
                expect(m.scrollView.page(count)).toBe(`${count}페이지`);
            }
        });

        it("evaluates Grid row reorder accessibility announcements", () => {
            const handleLabel = m.grid.rowReorderHandleAriaLabel("1행", "Alt + 위쪽 화살표 또는 Alt + 아래쪽 화살표로 이동합니다.");
            expect(handleLabel).toBe("1행. Alt + 위쪽 화살표 또는 Alt + 아래쪽 화살표로 이동합니다.");

            const disabledHandle = m.grid.rowReorderHandleAriaLabel("1행", "방향키로 이동합니다.", "행 순서 변경을 사용할 수 없습니다.");
            expect(disabledHandle).toBe("1행. 방향키로 이동합니다. 행 순서 변경을 사용할 수 없습니다.");

            expect(m.grid.rowReorderMoved(3, 1)).toBe("3행을 1번째 위치로 이동했습니다.");
        });

        it("evaluates ColorGradient accessibility label", () => {
            expect(m.colorGradient.saturationAndValueText(80, 50)).toBe("채도 80%, 명도 50%");
        });

        it("evaluates Rating value text across scale levels", () => {
            expect(m.rating.valueText(4, 5)).toBe("5점 만점에 4점");
            expect(m.rating.valueText(0, 10)).toBe("10점 만점에 0점");
            expect(m.rating.valueText(1, 1)).toBe("1점 만점에 1점");
        });
    });

    describe("particle-safety tests with diverse ending patterns", () => {
        const m = MONA_KO_KR_LOCALE.messages;

        // Test arbitrary strings ending with vowel, consonant, Latin letter, number, symbol
        const testLabels = [
            "프로젝트", // ends with vowel
            "이메일",   // ends with consonant (ㄹ)
            "Angular",  // Latin letters
            "2026",     // digits
            "A/B"       // symbols
        ];

        it("chip removeLabel is particle-neutral for diverse labels", () => {
            for (const label of testLabels) {
                const result = m.chip.removeLabel(label);
                expect(result).toBe(`${label} 삭제`);
            }
            expect(m.chip.removeLabel()).toBe("항목 삭제");
            expect(m.chip.removeLabel("")).toBe("항목 삭제");
        });

        it("grid filterByColumn is particle-neutral for diverse columns", () => {
            for (const col of testLabels) {
                const result = m.grid.filterByColumn(col);
                expect(result).toBe(`필터 기준: ${col}`);
            }
        });

        it("splitButton is particle-neutral for diverse texts", () => {
            for (const text of testLabels) {
                const result = m.splitButton.splitButton(text);
                expect(result).toBe(`${text}, 분할 버튼`);
            }
            expect(m.splitButton.splitButton("")).toBe("분할 버튼");
        });

        it("chart rangeDescription is particle-neutral for diverse titles", () => {
            for (const title of testLabels) {
                const result = m.chart.rangeDescription(title, "0", "100");
                expect(result).toBe(`${title}, 0~100`);
            }
        });

        it("dropdowns itemPosition is particle-neutral for diverse items", () => {
            for (const text of testLabels) {
                const result = m.dropdowns.itemPosition(text, 1, 5);
                expect(result).toBe(`${text}, 5개 중 1번째`);
            }
        });
    });
});
