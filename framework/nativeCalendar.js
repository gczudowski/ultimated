const PAGE = {
    Android: {
        CALENDARS: [
            {}, {
                CALENDAR_WEEKDAY: '//*[@resource-id="android:id/date_picker_header"]',
                CALENDAR_CURRENT_DAY_NUMBER: '//*[@resource-id="android:id/date_picker_day"]',
                CALENDAR_CURRENT_YEAR: '//*[@resource-id="android:id/date_picker_year"]',
                CALENDAR_CURRENT_MONTH: '//*[@resource-id="android:id/date_picker_month"]',
                CALENDAR_OK: '//*[@resource-id="android:id/button1"]',
                CALENDAR_DAY_CONTENT: '//*[@content-desc="01 November 2017"]',
                CALENDAR_DAY_CONTENT_DEC: '//*[@content-desc="01 December 2017"]',
                CALENDAR_DAY_NUMBER_DOWN: '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.DatePicker[1]/android.widget.LinearLayout[1]/android.widget.ViewAnimator[1]/android.widget.ListView[1]/android.view.View[2]/android.view.View',
                CALENDAR_DAY_NUMBER_UP: '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.DatePicker[1]/android.widget.LinearLayout[1]/android.widget.ViewAnimator[1]/android.widget.ListView[1]/android.view.View[1]/android.view.View'

            }, {
                CALENDAR_DAY_NUMBER: '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.DatePicker[1]/android.widget.LinearLayout[1]/android.widget.ViewAnimator[1]/android.view.ViewGroup[1]/com.android.internal.widget.ViewPager[1]/android.view.View[1]/android.view.View',
                CALENDAR_YEAR: '//*[@resource-id="android:id/date_picker_header_year"]',
                CALENDAR_DATE: '//*[@resource-id="android:id/date_picker_header_date"]',
                PREV_MONTH: '//*[@resource-id="android:id/prev"]',
                NEXT_MONTH: '//*[@resource-id="android:id/next"]',
                CALENDAR_OK: '//*[@resource-id="android:id/button1"]'
            }, {
                PREV_MONTH: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[2]/android.widget.Button[1]',
                NEXT_MONTH: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[2]/android.widget.Button[2]',
                CURRENT_MONTH: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[2]/android.widget.EditText',
                PREV_DAY: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[1]/android.widget.Button[1]',
                NEXT_DAY: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[1]/android.widget.Button[2]',
                CURRENT_DAY: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[1]/android.widget.EditText',
                PREV_YEAR: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[3]/android.widget.Button[1]',
                NEXT_YEAR: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[3]/android.widget.Button[2]',
                CURRENT_YEAR: '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.DatePicker/android.widget.LinearLayout/android.widget.LinearLayout/android.widget.NumberPicker[3]/android.widget.EditText',
                CALENDAR_OK: '//*[@resource-id="android:id/button1"]'
            }
        ]
    },
    iOS: {
        CALENDARS: [
            {
                CALENDAR_OK: '//XCUIElementTypeButton[@name="Ok"]'
            }
        ]
    }
};

PAGE.Android.CALENDARS[0].isCalendar = async () => {
    return false;
};

// CALENDAR TYPE 3 (ASUS Zenfone with carousel)
PAGE.Android.CALENDARS[3].isCalendar = async function() {
    return !!await isElement(PAGE.Android.CALENDARS[3].PREV_MONTH);
};

PAGE.Android.CALENDARS[3].goToPreviousMonth = async function() {
    await driver
        .elementByXPath(this.currentCalendarObject.PREV_MONTH).click();
};

PAGE.Android.CALENDARS[3].goToNextMonth = async function() {
    await driver
        .elementByXPath(this.currentCalendarObject.NEXT_MONTH).click();
};

PAGE.Android.CALENDARS[3].getCurrentMonthNumber = async function() {
    let currentMonth;

    if (this.isPolishLocale) {
        currentMonth = this._translateMonth(
            await driver.elementByXPath(this.currentCalendarObject.CURRENT_MONTH).text()
        );
    } else {
        currentMonth = await driver.elementByXPath(this.currentCalendarObject.CURRENT_MONTH).text();
    }

    const date = `1 ${currentMonth} 2000`;
    const currentMonthNumber = moment(new Date(date)).format('M');

    return currentMonthNumber;
};

PAGE.Android.CALENDARS[3].selectProperDayNumber = async function(targetDateMomentObject) {
    const targetDayNumber = targetDateMomentObject.format('D');

    const currentDayNumber = parseInt(await driver
        .elementByXPath(this.currentCalendarObject.CURRENT_DAY).text());

    if (targetDayNumber > currentDayNumber) {
        while (String(await driver.elementByXPath(this.currentCalendarObject.CURRENT_DAY).text()) !== targetDayNumber) {
            await driver
                .elementByXPath(this.currentCalendarObject.NEXT_DAY).click();
        }
    } else if (targetDayNumber < currentDayNumber) {
        while (String(await driver.elementByXPath(this.currentCalendarObject.CURRENT_DAY).text()) !== targetDayNumber) {
            await driver
                .elementByXPath(this.currentCalendarObject.PREV_DAY).click();
        }
    }
};

// CALENDAR TYPE 2 (Samsung Galaxy A5 with arrows left/right)
PAGE.Android.CALENDARS[2].isCalendar = async function() {
    return !!await isElement(`${PAGE.Android.CALENDARS[2].CALENDAR_DAY_NUMBER}[1]`);
};

PAGE.Android.CALENDARS[2].goToPreviousMonth = async function() {
    await driver
        .elementByXPath(this.currentCalendarObject.PREV_MONTH).click()
        .context(Framework.CONTEXTS.WEBVIEW)
        .context(Framework.CONTEXTS.NATIVE)
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER}[1]`).click();
};

PAGE.Android.CALENDARS[2].goToNextMonth = async function() {
    await driver
        .elementByXPath(this.currentCalendarObject.NEXT_MONTH).click()
        .context(Framework.CONTEXTS.WEBVIEW)
        .context(Framework.CONTEXTS.NATIVE)
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER}[1]`).click();
};

PAGE.Android.CALENDARS[2].getCurrentMonthNumber = async function() {
    const currentDayMonth = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_DATE).text()).split(',')[1];
    const currentYear = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_YEAR).text());
    let currentDate;
    let currentDateMomentObject;

    if (this.isPolishLocale) {
        currentDate = currentDayMonth.split('.');
        currentDateMomentObject = moment(new Date(`${currentDate[1]}.${currentDate[0]}.${currentYear}`));
    } else {
        currentDate = `${currentDayMonth} ${currentYear}`;
        currentDateMomentObject = moment(Date.parse(currentDate.replace(/[ap]m$/i, '')));
    }
    const currentMonthNumber = currentDateMomentObject.format('M');

    return currentMonthNumber;
};

PAGE.Android.CALENDARS[2].selectProperDayNumber = async function(targetDateMomentObject) {
    const targetDayNumber = targetDateMomentObject.format('D');

    await driver
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER}[${targetDayNumber}]`).click();
};

// CALENDAR TYPE 1 (LG G3 with swipe up down)
PAGE.Android.CALENDARS[1].isCalendar = async function() {
    const isCalendar = !!await isElement(`${PAGE.Android.CALENDARS[1].CALENDAR_DAY_NUMBER_DOWN}[1]`)
            || !!await isElement(`${PAGE.Android.CALENDARS[1].CALENDAR_DAY_NUMBER_UP}[1]`);

    return isCalendar;
};

PAGE.Android.CALENDARS[1].goToPreviousMonth = async function() {
    const height = Framework.SCREEN_HEIGHT * Framework.SCREEN_RATIO;
    const width =  Framework.SCREEN_WIDTH * Framework.SCREEN_RATIO;

    await driver.swipe({
        startX: parseInt(width * 0.5), startY: parseInt(height * 0.44),
        endX: parseInt(width * 0.5),  endY: parseInt(height * 0.765),
        duration: 800
    })
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[1]`).click();
};

PAGE.Android.CALENDARS[1].goToNextMonth = async function() {
    await driver.swipe({
        startX: 384, startY: 985,
        endX: 384,  endY: 592,
        duration: 800
    })
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[1]`).click();
};

PAGE.Android.CALENDARS[1].getCurrentMonthNumber = async function() {
    const currentDay = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_CURRENT_DAY_NUMBER).text());
    let currentMonth = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_CURRENT_MONTH).text());
    const currentYear = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_CURRENT_YEAR).text());
    if (this.isPolishLocale) {
        currentMonth = this._translateMonth(currentMonth);
    }
    const selectedDate = `${currentDay} ${currentMonth} ${currentYear}`;

    const currentDateMomentObject = moment(Date.parse(selectedDate.replace(/[ap]m$/i, '')));
    const currentMonthNumber = currentDateMomentObject.format('M');

    return currentMonthNumber;
};

PAGE.Android.CALENDARS[1].selectProperDayNumber = async function(targetDateMomentObject) {
    const targetDayNumber = targetDateMomentObject.format('D');

    if (!!await isElement(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[28]`)) {
        await driver
            .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[${targetDayNumber}]`).click();
    } else {
        await driver
            .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_DOWN}[${targetDayNumber}]`).click();
    }
};



// iOS
PAGE.iOS.CALENDARS[0].isCalendar = async function() {
    const isCalendar = await isElement(`${PAGE.iOS.CALENDARS[0].CALENDAR_OK}`);

    return isCalendar;
};

PAGE.iOS.CALENDARS[0].goToPreviousMonth = async function() {
    try {
        await driver.execute('mobile: selectPickerWheelValue', {
            order: 'previous',
            element: await driver.elementsByClassName('XCUIElementTypePickerWheel').second(),
            offset: 0.15
        });
    } catch(e) {}
};

PAGE.iOS.CALENDARS[0].goToNextMonth = async function() {
    try {
        await driver.execute('mobile: selectPickerWheelValue', {
            order: 'next',
            element: await driver.elementsByClassName('XCUIElementTypePickerWheel').second(),
            offset: 0.15
        });
    } catch(e) {}
};

PAGE.iOS.CALENDARS[0].getCurrentMonthNumber = async function() {
    let currentMonth;

    currentMonth = this._translateMonth(
        await driver.elementsByClassName('XCUIElementTypePickerWheel').second().text()
    );

    const date = `1 ${currentMonth} 2000`;
    const currentMonthNumber = moment(new Date(date)).format('M');

    return currentMonthNumber;
};

PAGE.iOS.CALENDARS[0].selectProperDayNumber = async function(targetDateMomentObject) {
    const targetDayNumber = targetDateMomentObject.format('D');
    const currentDayNumber = parseInt(await driver.elementsByClassName('XCUIElementTypePickerWheel').first().text());

    if (targetDayNumber > currentDayNumber) {
        while (String(await driver.elementsByClassName('XCUIElementTypePickerWheel').first().text()) !== targetDayNumber) {
            try {
                await driver.execute('mobile: selectPickerWheelValue', {
                    order: 'next',
                    element: await driver.elementsByClassName('XCUIElementTypePickerWheel').first(),
                    offset: 0.15
                });
            } catch(e) {}
        }
    } else if (targetDayNumber < currentDayNumber) {
        while (String(await driver.elementsByClassName('XCUIElementTypePickerWheel').first().text()) !== targetDayNumber) {
            try {
                await driver.execute('mobile: selectPickerWheelValue', {
                    order: 'previous',
                    element: await driver.elementsByClassName('XCUIElementTypePickerWheel').first(),
                    offset: 0.15
                });
            } catch(e) {}
        }
    }
};

const NativeCalender = class {
    constructor() {
        this.calendarType = null;
        this.currentCalendarObject = null;
        this.isPolishLocale = null;
    }

    async pickDate(targetDateMomentObject) {
        await goToNativeContext();

        if (!this.calendarType) {
            await this._detectDatePicker();
        }

        if (Framework.PLATFORM === Framework.ANDROID) {
            this.isPolishLocale = this._isPolishLocaleDetect();
        }
        await this._waitForDatePicker();
        // await this._goToProperYear(targetDateMomentObject);
        await this._goToProperMonth(targetDateMomentObject);
        await this._selectProperDayNumber(targetDateMomentObject);
        await this._submitDatePicker();

        await goToWebviewContext();
    }

    async _detectDatePicker() {
        for (let i = 0, max = PAGE[Framework.PLATFORM].CALENDARS.length; i < max; i++) {
            if (await PAGE[Framework.PLATFORM].CALENDARS[i].isCalendar()) {
                this.calendarType = i;
                this.currentCalendarObject = PAGE[Framework.PLATFORM].CALENDARS[i];

                break;
            }
        }
    }

    _isPolishLocaleDetect() {
        const isPolishSettingsLocale = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell getprop | grep locale`).includes('[persist.sys.locale]: [pl');
        const isPolishSettingsLanguage = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell getprop | grep language`).includes('[persist.sys.language]: [pl');

        return isPolishSettingsLocale || isPolishSettingsLanguage;
    }

    async _waitForDatePicker() {
        await this.currentCalendarObject.isCalendar();
    }

    async _goToProperYear(targetDateMomentObject) {
        const currentYearNumber = parseInt(await this.currentCalendarObject.getCurrentYearNumber.call(this));
        const targetYearNumber = parseInt(targetDateMomentObject.format('YYYY'));

        if (currentYearNumber > targetYearNumber) {
            while (parseInt(await this.currentCalendarObject.getCurrentYearNumber.call(this)) !== targetYearNumber) {
                await this.currentCalendarObject.goToPreviousYear.call(this);
            }
        } else if (currentYearNumber < targetYearNumber) {
            while (parseInt(await this.currentCalendarObject.getCurrentYearNumber.call(this)) !== targetYearNumber) {
                await this.currentCalendarObject.goToNextYear.call(this);
            }
        }
    }

    async _goToProperMonth(targetDateMomentObject) {
        const currentMonthNumber = parseInt(await this.currentCalendarObject.getCurrentMonthNumber.call(this));
        const targetMonthNumber = parseInt(targetDateMomentObject.format('M'));

        if (currentMonthNumber > targetMonthNumber) {
            while (parseInt(await this.currentCalendarObject.getCurrentMonthNumber.call(this)) !== targetMonthNumber) {
                await this.currentCalendarObject.goToPreviousMonth.call(this);
            }
        } else if (currentMonthNumber < targetMonthNumber) {
            while (parseInt(await this.currentCalendarObject.getCurrentMonthNumber.call(this)) !== targetMonthNumber) {
                await this.currentCalendarObject.goToNextMonth.call(this);
            }
        }
    }

    async _selectProperDayNumber(targetDateMomentObject) {
        await this.currentCalendarObject.selectProperDayNumber.call(this, targetDateMomentObject);
    }

    async _submitDatePicker() {
        await driver.elementByXPath(this.currentCalendarObject.CALENDAR_OK).click().sleep(1000);
    }

    _translateMonth(monthName) {
        switch(monthName.toLowerCase()) {
        case 'sty':
            return 'jan';
        case 'lut':
            return 'feb';
        case 'mar':
            return 'mar';
        case 'kwi':
            return 'apr';
        case 'maj':
            return 'may';
        case 'cze':
            return 'jun';
        case 'lip':
            return 'jul';
        case 'sie':
            return 'aug';
        case 'wrz':
            return 'sep';
        case 'paź':
            return 'oct';
        case 'lis':
            return 'nov';
        case 'gru':
            return 'dec';
        case 'styczeń':
            return 'jan';
        case 'luty':
            return 'feb';
        case 'marzec':
            return 'mar';
        case 'kwiecień':
            return 'apr';
        case 'czerwiec':
            return 'jun';
        case 'lipiec':
            return 'jul';
        case 'sierpień':
            return 'aug';
        case 'wrzesień':
            return 'sep';
        case 'październik':
            return 'oct';
        case 'listopad':
            return 'nov';
        case 'grudzień':
            return 'dec';
        default:
            return monthName;
        }
    }
};

export default new NativeCalender();