import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import webDriverInstance from 'wd';
import screenshotComparer from 'wd-screenshot';
import CONFIG from '../configGenerator';
import CommunicationManager from '../communicationManager';
import FacebookLogin from '../facebookLogin';
import NativeCalendar from '../nativeCalendar';
import LogsParser from '../logsParser';
import moment from 'moment';
import shelljs from 'shelljs';
import fs from 'fs';
import commonUtils from '../commonUtils';
import PNGCrop from 'png-crop';
import ReportCreator from './reportCreator';

const SuiteManagerClass = class {
    constructor () {
        global.Framework = {
            IOS: 'iOS',
            ANDROID: 'Android',
            PLATFORM: process.env.PLATFORM,
            SPECIAL_KEYS: webDriverInstance.SPECIAL_KEYS,
            PORT: parseInt(process.env.PORT),
            BEGIN_DATE_TIME: process.env.DATETIME,
            DEVICE_ID: process.env.DEVICE,
            LOGFILE: `${process.env.DATETIME}-${process.env.PORT}`,
            PARAMS: Ultimated.VAULT.PARAMS //TODO clone without reference
        };

        this.beginDateTime = process.env.DATETIME;
        this.deviceId = process.env.DEVICE;
        this.moduleName = null;
        this.initTime = null;
        this.suiteStartTime = null;
        this.reportData = {
            map: {},
            items: []
        };
        // this.report = [];
        // this.reportMap = {};

        this.serverConfig = {
            host: '127.0.0.1',
            port: process.env.PORT,
            protocol: 'http'
        };

        this.capsConfig = {
            udid: this.deviceId,
            deviceName: '*',
            platformName: process.env.PLATFORM,
            app: process.env.PLATFORM === Framework.ANDROID ? CONFIG.APK_PATH : CONFIG.APP_PATH,
            noReset: false,
            fullReset: false,
            automationName: process.env.PLATFORM === 'Android' ? "Appium" : "XCUITest",
            // unicodeKeyboard: true,
            // resetKeyboard: true
        };

        if (Framework.PLATFORM === Framework.IOS) {
            this.capsConfig.xcodeConfigFile = CONFIG.XCODE_CONFIG;
            this.capsConfig.wdaLocalPort = +process.env.PORT + 1500;
            this.capsConfig.webkitResponseTimeout = 20000;
            // this.capsConfig.nativeWebTap = true;
            // this.capsConfig.newCommandTimeout = 120;
            // this.capsConfig.wdaConnectionTimeout = 600000;
            // this.capsConfig.commandTimeouts = 600000;
            // this.capsConfig.webviewConnectRetries = 50;
            // this.capsConfig.autoWebview = true;

            this.capsConfig.skipUnlock = null;
            delete this.capsConfig.skipUnlock;

            this.capsConfig.androidInstallTimeout = null;
            delete this.capsConfig.androidInstallTimeout;
            this.capsConfig.startIWDP = true;
        }

        if (Framework.PLATFORM === Framework.ANDROID) {
            this.capsConfig.nativeWebScreenshot = true;
            this.capsConfig.disableAndroidWatchers = true;
            this.capsConfig.androidInstallTimeout = 240000;
            // this.capsConfig.skipUnlock = true;
            // autoGrantPermissions
            // dontStopAppOnReset:


            Framework.ANDROID_SDK = parseInt(shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell getprop ro.build.version.sdk`, { silent: true }).stdout);
            this.ensureProperChromedriverVersion();
        }

        if (Ultimated.VAULT.FLAGS.noReinstall === true) {
            this.capsConfig.noReset = true;
            this.capsConfig.fullReset = false;
        }

        if (PROJECT_CONFIG.desiredCapabilities) {
            this.capsConfig = {
                ...this.capsConfig,
                ...PROJECT_CONFIG.desiredCapabilities
            };
        }
    }

    ensureProperChromedriverVersion() {
        const chromeDump = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell pm dump com.android.chrome | grep -A 1 version`, { silent: true }).stdout;
        const mainPath = shelljs.exec('cd ~/.ultimated && pwd', { silent: true }).stdout.trim();
        let chromeDriver;

        if (Framework.ANDROID_SDK > 19) {
            if (chromeDump.includes('versionName=64') || chromeDump.includes('versionName=63')) {
                console.log('Detected Chrome version unsupported by Appium. Ultimated will use Chromedriver 2.36 to solve the issue...');
                chromeDriver = `${mainPath}/packages/chromedriver236/chromedriver`;
            } else if (chromeDump.includes('versionName=65') || chromeDump.includes('versionName=66') || chromeDump.includes('versionName=67')) {
                console.log('Detected Chrome version unsupported by Appium. Ultimated will use Chromedriver 2.38 to solve the issue...');
                chromeDriver = `${mainPath}/packages/chromedriver238/chromedriver`;
            } else if (chromeDump.includes('versionName=68') || chromeDump.includes('versionName=69') || chromeDump.includes('versionName=70')) {
                console.log('');
                console.error('WARNING! Detected an unsupported new version of Chrome! This may cause issues in running the tests');
                console.log('');
                chromeDriver = `${mainPath}/packages/chromedriver238/chromedriver`;
            }
        }

        if (chromeDriver && !this.capsConfig.chromedriverExecutable) {
            this.capsConfig.chromedriverExecutable = chromeDriver
        }
    }

    async initBefore (filename) {
        this.moduleName = filename.split('/').pop().split('.').shift();

        this.suiteStartMoment = moment();
        if (Framework.PLATFORM === Framework.IOS) {
            // TODO kill ios_webkit_debug_proxy only for current user
            // console.log('Killing all ios debug proxy instances...');
            // shelljs.exec(`killall ios_webkit_debug_proxy`, {silent: true});
            // shelljs.exec(`ios_webkit_debug_proxy -c ${Framework.DEVICE_ID}:${Framework.PORT+300} -d`, {silent: true, async: true});
        }


        const isTurboReset = Ultimated.VAULT.FLAGS.turboReset;
        if ((isTurboReset && !global.driver) || !isTurboReset) {
            const startMoment = moment();
            await this.initializeSuite();
            await this.initializeDriver();

            await this.turboReset();

            this.exposeFramework();
            this.exposeUltimatedMethods();
            this.initTime = Math.ceil(moment().diff(startMoment) / 1000);

            console.log(`Tests ready. Loading took ${this.initTime} seconds`);
            if (isTurboReset) {
                const approxSaveTime = Math.ceil(Object.keys(this.reportData.map).length * this.initTime / 60);
                console.log(`Turbo reset enabled! It will save approx ${approxSaveTime} minutes...`);
            }
        } else if (isTurboReset && global.driver) {
            await this.turboReset();
        }
    }

    async initializeSuite() {
        console.log('Initializing suite...');
        // TODO change framework.js to .ultimated/frameworkObject
        const frameworkPath = `${PROJECT_RELATIVE_PATH_DEEP}.ultimated/framework`;
        const framework = await require(frameworkPath).default;
        global.Framework =  Object.assign({}, global.Framework, framework);
        this.exposeChai(webDriverInstance);
        this.enhanceDriver(webDriverInstance);
        this.enhanceFramework(Framework);

        if (Framework.PLATFORM === Framework.ANDROID && Ultimated.VAULT.FLAGS.noReinstall !== true) {
            console.log('Cleaning android device...');

            const packagesList = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell pm list packages`, {silent: true}).stdout;

            if (packagesList.includes('io.appium.settings')) {
                try {
                    shelljs.exec(`adb -s ${Framework.DEVICE_ID} uninstall io.appium.settings`, {silent: true})
                } catch(ignore) {}
            }

            if (packagesList.includes('io.appium.unlock')) {
                try {
                    shelljs.exec(`adb -s ${Framework.DEVICE_ID} uninstall io.appium.unlock`, {silent: true})
                } catch(ignore) {}
            }
        }
    }

    async initializeDriver() {
        console.log('Installing app on the device...');
        const driver = webDriverInstance.promiseChainRemote(this.serverConfig);
        this.exposeDriver(driver);

        try {
            await driver.init(this.capsConfig);
        } catch (e) {
            console.log('Something went wrong while installing app... retry 1/1', e);
            await driver.quit();
            await driver.init(this.capsConfig);
        }
        console.log('App installed on the device');

        console.log('Current context: ', await driver.currentContext());
        let contexts = [];

        contexts = await driver.contexts();

        if ((contexts && contexts.length < 2) || !contexts) {
            console.log('No webviews active, retrying...');
            await driver.sleep(5000);
            contexts = await driver.contexts();
        }

        Framework.CONTEXT = contexts[contexts.length - 1];
        if (Framework.CONTEXT && contexts.length > 1) {
            console.log('Available contexts: ', contexts);
            console.log('Changing to WebView context: ', Framework.CONTEXT);
            await this.initializeDriverContext(driver, contexts);
        } else {
            console.log('Error! Webview context unavailable... Please try again later...');
            // process.exit(1);
            return;
        }

        console.log('WebView context ready! Setting up framework...');



        Framework.SCREEN_HEIGHT = (await driver.execute('return window.screen')).height;
        Framework.SCREEN_WIDTH = (await driver.execute('return window.screen')).width;
        Framework.SCREEN_RATIO = (await driver.execute('return window.devicePixelRatio'));
        Framework.SCREEN_RESOLUTION_HEIGHT = Framework.SCREEN_HEIGHT * Framework.SCREEN_RATIO;
        Framework.SCREEN_RESOLUTION_WIDTH = Framework.SCREEN_WIDTH * Framework.SCREEN_RATIO;
    }

    exposeChai(webDriverInstance) {
        chai.use(chaiAsPromised);
        chai.should();
        chaiAsPromised.transferPromiseness = webDriverInstance.transferPromiseness;
    }

    enhanceDriver(webDriverInstance) {
        const isSelectorXpath = this.isSelectorXpath;

        webDriverInstance.addPromiseChainMethod(
            'backspace',
            function() {
                return new Promise(async function(resolve, reject) {
                    if (Framework.PLATFORM === Framework.IOS) {
                        if (Framework.CONTEXT === Framework.CONTEXTS.WEBVIEW) {
                            try {
                                ////XCUIElementTypeKey[@name="delete"]
                                await global.driver.goToNativeContext();
                                await global.driver.elementByName('delete').click();
                                const result = await global.driver.goToWebviewContext();
                                resolve(result);
                            } catch (error) {
                                reject(`Error in backspace()! (Original Appium Error -> ${error})`);
                            }
                        } else {
                            try {
                                await global.driver.goToNativeContext();
                                const result = await global.driver.elementByName('delete').click();
                                resolve(result);
                            } catch (error) {
                                reject(`Error in backspace()! (Original Appium Error -> ${error})`);
                            }
                        }
                    } else {
                        try {
                            const result = await global.driver.keys(webDriverInstance.SPECIAL_KEYS['Back space']);
                            resolve(result);
                        } catch (error) {
                            reject(`Error in backspace()! (Original Appium Error -> ${error})`);
                        }
                    }
                });
            }
        );
        webDriverInstance.addPromiseChainMethod(
            'waitForClass',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                return this.waitForElementByClassName(selector, timeout);
            }
        );
        webDriverInstance.addPromiseChainMethod(
            'waitForCssSelector',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                return this.waitForElementByCssSelector(selector, timeout);
            }
        );
        webDriverInstance.addPromiseChainMethod(
            'waitForXPath',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                return this.waitForElementByXPath(selector, timeout);
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'scrollDown',
            function(cssSelector, scrollValue = Framework.SCREEN_HEIGHT * 3 / 4) {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    if (cssSelector) {
                        return this
                            .execute(`document.querySelector('${cssSelector}').scrollTop = ${scrollValue}`)
                            .sleep(500);
                    } else {
                        return this
                            .scroll(0, scrollValue);
                    }
                } else {
                    if (cssSelector) {
                        return this
                            .execute(`document.querySelector('${cssSelector}').scrollTop = ${scrollValue}`)
                            .sleep(500);
                    } else {
                        return this
                            .execute('mobile: scroll', {direction: 'down'});
                    }
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'scrollUp',
            function() {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    return this.scroll(0, 0);
                } else {
                    return this.execute('mobile: scroll', {direction: 'up'});
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'handleKeyboard',
            function() {
                return this.closeKeyboard();
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'closeKeyboard',
            function() {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    const output = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell dumpsys input_method | grep mInputShown`, {silent: true});

                    if (output.includes('mInputShown=true')) {
                        return this.hideKeyboard();
                    } else {
                        return this;
                    }
                } else {
                    const closeKeyboardIos = async () => {
                        const iosKeyboardDoneButton = `//XCUIElementTypeButton[@name="Done"]`;

                        const initialContext = Framework.CONTEXT;
                        if (initialContext === Framework.CONTEXTS.WEBVIEW) {
                            await this.goToNativeContext();
                        }
                        const closeKeyboardButton = await this.elementByXPathOrNull(iosKeyboardDoneButton);
                        if (!!closeKeyboardButton) {
                            await closeKeyboardButton.click();
                        }

                        if (initialContext === Framework.CONTEXTS.WEBVIEW) {
                            await this.goToWebviewContext();
                        }
                    };

                    return closeKeyboardIos();
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'selectElement',
            function(selector, timeout = CONFIG.DEFAULT_WAIT_TIMEOUT_MS) {
                if (isSelectorXpath(selector)) {
                    return new Promise((resolve, reject) => {
                        this
                            .waitForElementByXPath(selector, timeout)
                            .elementByXPath(selector)
                            .then((arg1) => {
                                resolve(arg1);
                            }).catch((err) => {
                            reject(`Error in selectElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        this
                            .waitForElementByCssSelector(selector, timeout)
                            .elementByCssSelector(selector)
                            .then((arg1) => {
                                resolve(arg1);
                            }).catch((err) => {
                            reject(`Error in selectElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'selectElements',
            function(selector, timeout = CONFIG.DEFAULT_WAIT_TIMEOUT_MS) {
                if (isSelectorXpath(selector)) {
                    return new Promise((resolve, reject) => {
                        this
                            .waitForElementByXPath(selector, timeout)
                            .elementsByXPath(selector)
                            .then((arg1) => {
                                resolve(arg1);
                            }).catch((err) => {
                            reject(`Error in selectElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        this
                            .waitForElementByCssSelector(selector, timeout)
                            .elementsByCssSelector(selector)
                            .then((arg1) => {
                                resolve(arg1);
                            }).catch((err) => {
                            reject(`Error in selectElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'waitForElement',
            function(selector, timeout = CONFIG.DEFAULT_WAIT_TIMEOUT_MS) {
                if (isSelectorXpath(selector)) {
                    return new Promise((resolve, reject) => {
                        this.waitForElementByXPath(selector, timeout).then((arg1) => {
                            resolve(arg1);
                        }).catch((err) => {
                            reject(`Error in waitForElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        this.waitForElementByCssSelector(selector, timeout).then((arg1) => {
                            resolve(arg1);
                        }).catch((err) => {
                            reject(`Error in waitForElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'waitLongerForElement',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                if (isSelectorXpath(selector)) {
                    return new Promise((resolve, reject) => {
                        this.waitForElementByXPath(selector, timeout).then((arg1) => {
                            resolve(arg1);
                        }).catch((err) => {
                            reject(`Error in waitLongerForElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        this.waitForElementByCssSelector(selector, timeout).then((arg1) => {
                            resolve(arg1);
                        }).catch((err) => {
                            reject(`Error in waitLongerForElement(${selector})! (Original Appium Error -> ${err})`);
                        });
                    });
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'isElement',
            function(selector) {
                if (isSelectorXpath(selector)) {
                    return new Promise((resolve, reject) => {
                        this.elementByXPathOrNull(selector).then((arg1) => {
                            resolve(!!arg1);
                        }).catch((err) => {
                            if (err.message && err.message.includes('A modal dialog was open, blocking this operation')) {
                                resolve(false);
                            } else {
                                reject(`Error in isElement(${selector})! (Original Appium Error -> ${err})`);
                            }
                        });
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        this.elementByCssSelectorOrNull(selector).then((arg1) => {
                            resolve(!!arg1);
                        }).catch((err) => {
                            if (err.message && err.message.includes('A modal dialog was open, blocking this operation')) {
                                resolve(false);
                            } else {
                                reject(`Error in isElement(${selector})! (Original Appium Error -> ${err})`);
                            }
                        });
                    });
                }
            }
        );

        // swipe example
        // await driver.context(Framework.CONTEXTS.NATIVE);
        // await driver.swipe({
        //     startX: 20, startY: 200,
        //     endX: 20,  endY: 80,
        //     duration: 800
        // });
        webDriverInstance.addPromiseChainMethod(
            'swipe',
            function (opts) {
                const action = new webDriverInstance.TouchAction();
                opts.duration = opts.duration || 500;

                action
                    .press({x: opts.startX, y: opts.startY})
                    .wait(opts.duration)
                    .moveTo({x: opts.endX, y: opts.endY})
                    .release();

                if (Framework.CONTEXT === Framework.CONTEXTS.WEBVIEW) {
                    return this
                        .context(Framework.CONTEXTS.NATIVE)
                        .performTouchAction(action)
                        .context(Framework.CONTEXTS.WEBVIEW);
                } else {
                    return this
                        .performTouchAction(action);
                }
            }
        );

        // webDriverInstance.addPromiseChainMethod(
        //     'tapp',
        //     function (element) {
        //         const action = new webDriverInstance.TouchAction();
        //         action.tap({el: element});
        //
        //         return this
        //             .performTouchAction(action)
        //     }
        // );

        webDriverInstance.addPromiseChainMethod(
            'goToWebviewContext',
            function() {
                Framework.CONTEXT = Framework.CONTEXTS.WEBVIEW;

                return this
                    .context(Framework.CONTEXTS.WEBVIEW);
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'goToNativeContext',
            function() {
                Framework.CONTEXT = Framework.CONTEXTS.NATIVE;

                return this
                    .context(Framework.CONTEXTS.NATIVE);
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'swipeDown',
            function() {
                const height = Framework.SCREEN_HEIGHT * Framework.SCREEN_RATIO;
                const width =  Framework.SCREEN_WIDTH * Framework.SCREEN_RATIO;

                return this.swipe({
                    startX: parseInt(width * 0.5), startY: parseInt(height * 0.25),
                    endX: parseInt(width * 0.5),  endY: parseInt(height * 0.75),
                    duration: 800
                });
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'swipeUp',
            function() {
                const height = Framework.SCREEN_HEIGHT * Framework.SCREEN_RATIO;
                const width =  Framework.SCREEN_WIDTH * Framework.SCREEN_RATIO;

                return this.swipe({
                    endX: parseInt(width * 0.5), endY: parseInt(height * 0.25),
                    startX: parseInt(width * 0.5),  startY: parseInt(height * 0.75),
                    duration: 800
                });
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'scrollDownUntilElement',
            function(selector) {
                const height = Framework.SCREEN_HEIGHT * Framework.SCREEN_RATIO;
                const width =  Framework.SCREEN_WIDTH * Framework.SCREEN_RATIO;

                return new Promise(async (resolve, reject) => {
                    while(!await this.selectElement(selector).isDisplayed()) {
                        await this.swipe({
                            endX: parseInt(width * 0.5), endY: parseInt(height * 0.25),
                            startX: parseInt(width * 0.5),  startY: parseInt(height * 0.75),
                            duration: 800
                        });
                        await sleep(1000);
                    }

                    resolve();
                });
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'waitForPossibleElement',
            function(selector, timeout = 2000) {
                const timerTimeout = 25;
                const startTimestamp = +new Date();

                return new Promise(function (resolve) {
                    function check(selector) {
                        global.driver.isElement(selector).then((result) => {
                            if (result) {
                                resolve();
                            } else {
                                const currentTimestamp = +new Date();
                                const timeoutTimestamp = startTimestamp + timeout;

                                if (currentTimestamp > timeoutTimestamp) {
                                    resolve();
                                } else {
                                    setTimeout(check.bind(null, selector), timerTimeout);
                                }
                            }
                        }).catch((error) => {
                            resolve();
                        });
                    }

                    check(selector);
                });
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'waitUntilElementHidden',
            function(selector, timeout = 2000) {
                const timerTimeout = 25;
                const startTimestamp = +new Date();

                return new Promise(function (resolve) {
                    function check(selector) {
                        global.driver.isElement(selector).then((result) => {
                            if (!result) {
                                resolve();
                            } else {
                                const currentTimestamp = +new Date();
                                const timeoutTimestamp = startTimestamp + timeout;

                                if (currentTimestamp > timeoutTimestamp) {
                                    resolve();
                                } else {
                                    setTimeout(check.bind(null, selector), timerTimeout);
                                }
                            }
                        }).catch((error) => {
                            resolve();
                        });
                    }

                    check(selector);
                });
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'clickNativeSelectElementByPosition',
            function(position, timeout = CONFIG.DEFAULT_WAIT_TIMEOUT_MS) {
                const nativeSelectBodyNewDevices = '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.ListView[1]/android.widget.CheckedTextView';
                const nativeSelectBodyOldDevices = '/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ListView/android.widget.TextView';
                const positionString = String(position);
                let nativeSelectBody;

                return new Promise((resolve, reject) => {
                    if (Framework.PLATFORM === Framework.ANDROID) {
                        if (Framework.CONTEXT === Framework.CONTEXTS.WEBVIEW) {
                            this.goToNativeContext().isElement(`${nativeSelectBodyNewDevices}[1]`).then(async (result) => {
                                nativeSelectBody = !!result ? nativeSelectBodyNewDevices : nativeSelectBodyOldDevices;

                                try {
                                    await this.goToNativeContext();
                                    await this.waitLongerForElement(`${nativeSelectBody}[${positionString}]`);

                                    //scrolls to top of the list
                                    if (!!await isElement(`${nativeSelectBodyNewDevices}[8]`)) {
                                        await this.swipeDown();
                                    }

                                    await this.selectElement(`${nativeSelectBody}[${positionString}]`).click()
                                    await this.goToWebviewContext();
                                    resolve();
                                } catch (error) {
                                    reject(`Error in clickNativeSelectElementByPosition(${positionString})! (Original Appium Error -> ${err})`);
                                }
                            });
                        } else {
                            this.isElement(`${nativeSelectBodyNewDevices}[1]`).then((result) => {
                                nativeSelectBody = !!result ? nativeSelectBodyNewDevices : nativeSelectBodyOldDevices;

                                this
                                    .waitLongerForElement(`${nativeSelectBody}[${positionString}]`)
                                    .swipeDown()
                                    .selectElement(`${nativeSelectBody}[${positionString}]`)
                                    .click()
                                    .then((arg1) => {
                                        resolve(arg1);
                                    }).catch((err) => {
                                    reject(`Error in clickNativeSelectElementByPosition(${positionString})! (Original Appium Error -> ${err})`);
                                });
                            });
                        }
                    } else {
                        const iosKeyboard = `//XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther[2]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther[1]`;
                        const swipeCountDown = position - 1;

                        if (Framework.CONTEXT === Framework.CONTEXTS.WEBVIEW) {
                            const webviewfunc = async () => {
                                await this
                                    .goToNativeContext()
                                    .waitForElement(iosKeyboard);


                                await this.tapXY(0.5, 0.741); // 1 up
                                await this.tapXY(0.5, 0.704); // 2 up
                                await this.tapXY(0.5, 0.633); // 3 up
                                await this.tapXY(0.5, 0.633); // 3 up

                                for (let i = 0; i < swipeCountDown; i++) {
                                    await this.tapXY(0.5, 0.862);
                                }

                                await this.selectElement(`//XCUIElementTypeButton[@name="Done"]`).click();

                                await this.goToWebviewContext();

                                resolve();
                            };

                            webviewfunc();
                        } else {
                            const nativefunc = async () => {
                                await this.waitForElement(iosKeyboard);

                                await this.tapXY(0.5, 0.741); // 1 up
                                await this.tapXY(0.5, 0.704); // 2 up
                                await this.tapXY(0.5, 0.633); // 3 up
                                await this.tapXY(0.5, 0.633); // 3 up

                                for (let i = 0; i < swipeCountDown; i++) {
                                    await this.tapXY(0.5, 0.862);
                                }

                                await this.hideKeyboard();
                                // await this.selectElement(`//XCUIElementTypeButton[@name="Done"]`).click();

                                resolve();
                            };

                            nativefunc();
                        }
                    }
                });
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'tapXY',
            function(x, y) {
                const { PLATFORM, ANDROID, SCREEN_HEIGHT, SCREEN_WIDTH, SCREEN_RATIO } = Framework;

                const height = PLATFORM === ANDROID ? SCREEN_HEIGHT * SCREEN_RATIO : SCREEN_HEIGHT;
                const width = PLATFORM === ANDROID ? SCREEN_WIDTH * SCREEN_RATIO : SCREEN_WIDTH;

                if (Framework.CONTEXT === Framework.CONTEXTS.WEBVIEW) {
                    return this
                        .goToNativeContext()
                        .swipe({
                            startX: parseInt(width * x), startY: parseInt(height * y),
                            endX: parseInt(width * x),  endY: parseInt(height * y),
                            duration: 50
                        })
                        .goToWebviewContext();
                } else {
                    return this.swipe({
                        startX: parseInt(width * x), startY: parseInt(height * y),
                        endX: parseInt(width * x),  endY: parseInt(height * y),
                        duration: 50
                    });
                }
            }
        );

        // webDriverInstance.addPromiseChainMethod(
        //     'tapLocation',
        //     function(location) {
        //         const x = parseInt(location.x);
        //         const y = parseInt(location.y);
        //         const { PLATFORM, ANDROID, SCREEN_HEIGHT, SCREEN_WIDTH, SCREEN_RATIO } = Framework;
        //         console.log('######### #debug tapLocation', location);
        //         console.log('######### #debug tapLocation x', x);
        //         console.log('######### #debug tapLocation y', y);
        //
        //         if (Framework.CONTEXT === Framework.CONTEXTS.WEBVIEW) {
        //             console.log('######### #debug tapping in webview');
        //
        //             return this
        //                 .goToNativeContext()
        //                 .swipe({
        //                     startX: parseInt(x * SCREEN_RATIO), startY: parseInt(y * SCREEN_RATIO),
        //                     endX: parseInt(x * SCREEN_RATIO),  endY: parseInt(y * SCREEN_RATIO),
        //                     duration: 50
        //                 })
        //                 .swipe({
        //                     startX: parseInt(x + 5), startY: parseInt(y + 5),
        //                     endX: parseInt(x + 5),  endY: parseInt(y + 5),
        //                     duration: 50
        //                 })
        //                 .goToWebviewContext();
        //         } else {
        //             console.log('######### #debug tapping in native');
        //             return this.swipe({
        //                 startX: parseInt(location.x), startY: parseInt(location.y),
        //                 endX: parseInt(location.x),  endY: parseInt(location.y),
        //                 duration: 50
        //             });
        //
        //         }
        //
        //     }
        // );

        webDriverInstance.addPromiseChainMethod(
            'customClickElement',
            function(selector) {
                return new Promise((resolve, reject) => {
                    global.driver.clickElement(selector).then((data) => {
                        resolve();
                    }).catch((err) => {
                        if (err.message && err.message.includes('dialog has invalid')) {
                            resolve();
                        } else {
                            reject(`Error in clickElement(${selector})! (Original Appium Error -> ${err})`);
                        }
                    });
                });

            }
        );
    }

    isSelectorXpath(selector) {
        return selector.includes('//') || selector.includes('/hierarchy');
    }

    exposeDriver(driver) {
        global.driver = driver;
        global.driver.screenshot = async (path) => {
            await driver.saveScreenshot(`reports/${this.beginDateTime}/${this.deviceId}/${this.moduleName}-${path}.png`);
        };

        global.driver.compare = async (path, tolerance = 0.00001) => {
            const createMissingVisualReferenceDirectories = () => {
                if (!fs.existsSync(`screenshot-reference/${this.moduleName}`)) {
                    shelljs.exec(`mkdir screenshot-reference/${this.moduleName}`, { silent: true });
                }

                if (!fs.existsSync(`screenshot-reference/${this.moduleName}/${path}`)) {
                    shelljs.exec(`mkdir screenshot-reference/${this.moduleName}/${path}`, { silent: true });
                }

                if (!!Ultimated.VAULT.VISUAL_TEST_PREFIX && !fs.existsSync(`screenshot-reference/${this.moduleName}/${path}/${Ultimated.VAULT.VISUAL_TEST_PREFIX}`)) {
                    shelljs.exec(`mkdir screenshot-reference/${this.moduleName}/${path}/${Ultimated.VAULT.VISUAL_TEST_PREFIX}`, { silent: true });
                }
            };
            createMissingVisualReferenceDirectories();

            Ultimated.VAULT.LAST_VISUAL_TEST_ID = path;

            if (Ultimated.VAULT.FLAGS.saveVisualTestReference === false) {
                console.log('Ultimated was started with the saveVisualTestReference flag. Visual reference disabled');
                return true;
            }

            // if (Framework.PLATFORM === Framework.IOS) {
            //     console.log('Visual testing unavailable on iOS. Try again later!');
            //     return true;
            // }

            const comparer = screenshotComparer({
                Q: driver.Q,
                tolerance: tolerance
            });

            let referenceImagePath;
            let oryginalImagePath;
            if (Ultimated.VAULT.VISUAL_TEST_PREFIX) {
                referenceImagePath = `screenshot-reference/${this.moduleName}/${path}/${Ultimated.VAULT.VISUAL_TEST_PREFIX}/${this.deviceId}.png`;
                if (fs.existsSync(`screenshot-reference/${this.moduleName}/${path}/${this.deviceId}.png`)) {
                    oryginalImagePath = `screenshot-reference/${this.moduleName}/${path}/${this.deviceId}.png`;
                }
            } else {
                referenceImagePath = `screenshot-reference/${this.moduleName}/${path}/${this.deviceId}.png`;
            }

            const screenshotPath = `reports/${this.beginDateTime}/${this.deviceId}/${this.moduleName}-${path}.png`;

            await global.driver.screenshot(path);

            if (fs.existsSync(`${referenceImagePath}`)) {
                const androidStatusBarHeight = 25 * Framework.SCREEN_RATIO;

                shelljs.exec(`mkdir screenshot-reference/screenshotReferenceCompare`, { silent: true });
                shelljs.exec(`mkdir screenshot-reference/screenshotReferenceCompare/${this.deviceId}`, { silent: true });
                const cropConfig = {width: 9999, height: 9999, top: androidStatusBarHeight, left: 0}; //huawai 75px top, samsung a5 50px top

                await new Promise((resolve) => {
                    PNGCrop.crop(referenceImagePath, `screenshot-reference/screenshotReferenceCompare/${this.deviceId}/referenceImage.png`, cropConfig, () => {
                        resolve();
                    });
                });

                await new Promise((resolve) => {
                    PNGCrop.crop(screenshotPath, `screenshot-reference/screenshotReferenceCompare/${this.deviceId}/currentImage.png`, cropConfig, () => {
                        resolve();
                    });
                });

                shelljs.exec(`mkdir reports/${this.beginDateTime}/${this.deviceId}/${path}`, { silent: false });
                shelljs.exec(`cp ${screenshotPath} reports/${this.beginDateTime}/${this.deviceId}/${path}/currentImage.png`, {silent: false});
                shelljs.exec(`cp ${referenceImagePath} reports/${this.beginDateTime}/${this.deviceId}/${path}/referenceImage.png`, {silent: false});

                return await new Promise((resolve, reject) => {
                    comparer.compareScreenshot(
                        `screenshot-reference/screenshotReferenceCompare/${this.deviceId}/referenceImage.png`,
                        `screenshot-reference/screenshotReferenceCompare/${this.deviceId}/currentImage.png`,
                        { file: `reports/${this.beginDateTime}/${this.deviceId}/${this.moduleName}-DIFF-${path}.png` }
                    ).then((score) => {
                        console.log('Visual test passed with score:', score);
                        shelljs.exec(`rm -rf ${screenshotPath}`, {silent: true});
                        shelljs.exec(`rm -rf screenshot-reference/screenshotReferenceCompare/${this.deviceId}`, {silent: true});
                        shelljs.exec(`rm -rf reports/${this.beginDateTime}/${this.deviceId}/${this.moduleName}-DIFF-${path}.png`, {silent: true});

                        resolve();
                    }, (err) => {
                        const errMsg = `Visual test "${path}" ended with error: ${err}`;
                        console.log(errMsg);
                        shelljs.exec(`cp ${referenceImagePath} reports/${this.beginDateTime}/${this.deviceId}/${path}/referenceImage.png`, {silent: true});
                        shelljs.exec(`cp ${oryginalImagePath} reports/${this.beginDateTime}/${this.deviceId}/${path}/oryginalImage.png`, {silent: true});
                        shelljs.exec(`cp ${screenshotPath} reports/${this.beginDateTime}/${this.deviceId}/${path}/currentImage.png`, {silent: true});



                        shelljs.exec(`mv reports/${this.beginDateTime}/${this.deviceId}/${this.moduleName}-DIFF-${path}.png reports/${this.beginDateTime}/${this.deviceId}/${path}/diff.png`, {silent: true});
                        shelljs.exec(`rm -rf ${screenshotPath}`, {silent: true});
                        shelljs.exec(`rm -rf screenshot-reference/screenshotReferenceCompare/${this.deviceId}`, {silent: true});

                        reject(errMsg);
                    });
                });
            } else {
                shelljs.exec(`mv ${screenshotPath} ${referenceImagePath}`, { silent: true});
            }
        };
    }

    enhanceFramework() {
        Framework.utils = {
            getElementsListIndexByPhrase: async (phrase, list) => {
                let phraseIndex = 0;
                let i = 0;

                for (let listElement of list) {
                    if (String(await listElement.text()).toLowerCase().includes(phrase.toLowerCase())) {
                        phraseIndex = i;
                    }
                    i++;
                }

                return phraseIndex;
            },
            logInWithFacebook: async (username, password) => {
                await FacebookLogin.logIn(username, password);
            },
            nativeCalendar: NativeCalendar,
            back: async () => {
                shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell input keyevent KEYCODE_BACK`, { silent: true });
            }
        }
    }

    async initializeDriverContext(driver, contexts) {
        try {
            await driver.context(Framework.CONTEXT);

            Framework.CONTEXTS = {
                WEBVIEW: Framework.CONTEXT,
                NATIVE: contexts[0]
            };
        } catch (e) {
            console.log(e);
            console.log('Context change error, retrying (1/2)...', Framework.CONTEXT);

            try {
                await driver.context(Framework.CONTEXT);
            } catch (e) {
                console.log(e);

                if (contexts.length > 2 && contexts.length -2 !== 0) {
                    Framework.CONTEXT = contexts[2];
                }

                console.log('Context change error, retrying (2/2)...', Framework.CONTEXT);

                await driver.context(Framework.CONTEXT);
            }
        }
    }

    exposeFramework() {
        global.Framework = Framework;
        global.moment = moment;
        global.shelljs = shelljs;
    }

    exposeUltimatedMethods() {
        global.selectElement = driver.selectElement.bind(driver);
        global.selectElements = driver.selectElements.bind(driver);
        global.waitForElement = driver.waitForElement.bind(driver);
        global.waitLongerForElement = driver.waitLongerForElement.bind(driver);
        global.isElement = driver.isElement.bind(driver);
        global.handleKeyboard = driver.handleKeyboard.bind(driver);
        global.closeKeyboard = driver.closeKeyboard.bind(driver);
        global.hideKeyboard = driver.hideKeyboard.bind(driver);
        global.sleep = driver.sleep.bind(driver);
        global.swipe = driver.swipe.bind(driver);
        global.goToNativeContext = driver.goToNativeContext.bind(driver);
        global.goToWebviewContext = driver.goToWebviewContext.bind(driver);
        global.visualTest = driver.compare.bind(driver);
        global.scrollDown = driver.scrollDown.bind(driver);
        global.clickNativeSelectElementByPosition = driver.clickNativeSelectElementByPosition.bind(driver);
        global.waitForPossibleElement = driver.waitForPossibleElement.bind(driver);
        global.waitUntilElementHidden = driver.waitUntilElementHidden.bind(driver);
        global.swipeUp = driver.swipeUp.bind(driver);
        global.swipeDown = driver.swipeDown.bind(driver);
        global.tapXY = driver.tapXY.bind(driver);
        global.scrollDownUntilElement = driver.scrollDownUntilElement.bind(driver);
        global.clickElement = driver.customClickElement.bind(driver);
        // global.tapLocation = driver.tapLocation.bind(driver);
        // global.tapElement = driver.tapp.bind(driver);

        global.setVisualTestPrefix = this.setVisualTestPrefix;
    }

    setVisualTestPrefix(prefix) {
        Ultimated.VAULT.VISUAL_TEST_PREFIX = prefix;
    }
    
    killExistingMovieRecordingProcesses() {
        const screenredordResponse = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell ps | grep screenrecord`, { silent: true }).stdout;
        const screenrecordPIDRegex = screenredordResponse.match(/[0-9]+/);
        if (screenrecordPIDRegex && screenrecordPIDRegex[0]) {
            const screenrecordPID = screenrecordPIDRegex[0];
            shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell kill -2 ${screenrecordPID}`, { silent: false });
        }
    }

    async waitUntilMovieClosed(count = 0) {
        if (Framework.PLATFORM === Framework.ANDROID) {
            const screenredordResponse = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell ps | grep screenrecord`, { silent: true }).stdout;

            if (screenredordResponse) {
                count++;
                if (count > 20) {
                    this.killExistingMovieRecordingProcesses();
                }

                await this.waitUntilMovieClosed(count);
            }
        }
    }

    async initAfter () {
        this.recordSuiteExecutionTime();

        ReportCreator.createReport({
            ...this.reportData,
            beginDateTime: this.beginDateTime
        });
        fs.writeFileSync(`./reports/${this.beginDateTime}/combinedReportData/${this.deviceId}`, JSON.stringify(this.reportData));

        if (Ultimated.VAULT.FLAGS.turboReset && !this.isLastDescribe()) {
            const startTime = moment();
            await this.turboReset();
            const endTime = Math.ceil(moment().diff(startTime) / 1000);
            console.log(`Turbo reset finished. Saved ${this.initTime - endTime} seconds. Executing next suite...`);
        } else {
            await this.quitDriver();
        }
    }

    recordSuiteExecutionTime() {
        const mapIndex = Object.keys(this.reportData.map).indexOf(Ultimated.VAULT.LAST_DESCRIBE);

        const executionTime = Math.ceil(moment().diff(this.suiteStartMoment) / 1000 / 60);

        this.reportData.map[Object.keys(this.reportData.map)[mapIndex]].executionTime = executionTime;

        console.log(`Suite finished. It took approx ${executionTime} minutes`);
    }

    isLastDescribe() {
        return Object.keys(this.reportData.map).length - 1 === Object.keys(this.reportData.map).indexOf(Ultimated.VAULT.LAST_DESCRIBE);
    }

    async turboReset() {
        if (Framework.CONTEXT !== Framework.CONTEXTS.WEBVIEW) {
            await goToWebviewContext();
        }
        await driver.execute(`localStorage.clear()`);
        await driver.execute('window.location.href = window.location.origin + window.location.pathname');
    }

    async quitDriver() {
        if (driver) {
            try {
                await driver.quit();
            } catch(e) {
                console.log('Init after error:', e);
            }
        } else {
            console.log('Something went wrong, driver is not defined...');
        }
    }

    executeTestSuite (its, filename) {
        return function () {
            before(SuiteManager.initBefore.bind(SuiteManager, filename));
            beforeEach(function () {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    SuiteManager.killExistingMovieRecordingProcesses();
                    // shelljs.exec(`adb -s ${this.deviceId} shell input keyevent KEYCODE_WAKEUP`, {silent: true});
                    shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell input keyevent 224`, { silent: true });

                    const isScreenOff = shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell dumpsys input_method | grep mScreenOn=false`, { silent: true }).stdout.includes('mScreenOn=false');
                    if (isScreenOff) {
                        console.log('######### #debug DETECTED SCREEN IS STILL OFF!!!');
                        shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell input keyevent 26`, { silent: true });
                    }

                    // screen recording
                    // #video_recording
                    shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell rm /sdcard/it.mp4`, { silent: true });
                    shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell screenrecord /sdcard/it.mp4`, { silent: true, async: true });

                    // TODO use this info to write screen turn on/off script for android
                    // adb shell input touchscreen swipe 930 880 930 380 //Swipe UP
                    // adb shell input keyevent 82 && adb shell input keyevent 66 //unlock screen without pass
                    // adb shell input keyevent KEYCODE_POWER
                    // Android < 5.x.x
                    // adb shell dumpsys input_method
                    // In the output search for mScreenOn=true/false
                    //
                    //     Android >= 5.x.x
                    // adb shell dumpsys display
                    // In the output search for mScreenState=ON/OFF
                }
            });

            if (global.beforeEachSuite) {
                global.beforeEachSuite();
            }



            its();

            afterEach(function (done) {
                // screen recording
                if (Framework.PLATFORM === Framework.ANDROID) {
                    SuiteManager.killExistingMovieRecordingProcesses();
                }

                const fileName = SuiteManager.reportData.map[this.currentTest.parent.title][this.currentTest.title];
                const reportPath = `reports/${SuiteManager.beginDateTime}/${SuiteManager.deviceId}`;

                CommunicationManager.updateItStatus({
                    parent: this.currentTest.parent.title,
                    title: this.currentTest.title,
                    status: this.currentTest.state,
                    duration: this.currentTest.duration,
                    deviceId: SuiteManager.deviceId
                });

                const mapId = SuiteManager.reportData.map[this.currentTest.parent.title][this.currentTest.title];
                SuiteManager.reportData.items[mapId].moduleName = SuiteManager.moduleName;
                SuiteManager.reportData.items[mapId].state = this.currentTest.state;
                SuiteManager.reportData.items[mapId].duration = this.currentTest.duration;
                SuiteManager.reportData.items[mapId].finalError = global.finalError || '';
                SuiteManager.reportData.items[mapId].visualTestId = Ultimated.VAULT.LAST_VISUAL_TEST_ID;
                SuiteManager.reportData.items[mapId].prefixPathPart = !!Ultimated.VAULT.VISUAL_TEST_PREFIX ? `/${Ultimated.VAULT.VISUAL_TEST_PREFIX}` : '';
                global.finalError = '';
                Ultimated.VAULT.LAST_VISUAL_TEST_ID = '';
                Ultimated.VAULT.LAST_DESCRIBE = this.currentTest.parent.title;
                ReportCreator.createReport({
                    ...SuiteManager.reportData,
                    beginDateTime: SuiteManager.beginDateTime
                });

                if (this.currentTest.state === 'failed') {
                    Ultimated.VAULT.FAILED++;
                    if (Framework.PLATFORM === Framework.ANDROID) {
                        // shelljs.exec(`adb -s ${this.deviceId} shell input keyevent KEYCODE_WAKEUP`, {silent: true});
                        shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell input keyevent 224`, { silent: true });
                    }

                    if (Ultimated.VAULT.FAILED === 1) {
                        console.log('First test failed. Checking for known Appium issues in Appium log file...');
                        LogsParser.checkLogFileForKnownErrors(Framework.LOGFILE);
                    }

                    console.log('Test failed, taking screenshot...');
                    global.driver.screenshot(`FAILED-${this.currentTest.title}`).then(() => {
                        SuiteManager.reportData.items[mapId].failScreenshot = true;

                        if (Framework.PLATFORM === Framework.ANDROID) {
                            console.log('Screenshot taken, saving movie...');

                            // #video_recording
                            SuiteManager.waitUntilMovieClosed().then(() => {
                                shelljs.exec(`cd ${reportPath} && adb -s ${Framework.DEVICE_ID} pull /sdcard/it.mp4`, { silent: false });
                                shelljs.exec(`mv ${reportPath}/it.mp4 ${reportPath}/${fileName}.mp4`, { silent: true });
                                shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell rm /sdcard/it.mp4`, { silent: true });
                                console.log('Movie saved.');
                                done();
                            });
                        } else {
                            done();
                        }
                    }).catch((e) => {
                        console.log('Taking screenshot failed! Error:', e);
                        // #video_recording
                        if (Framework.PLATFORM === Framework.ANDROID) {
                            SuiteManager.waitUntilMovieClosed().then(() => {
                                shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell rm /sdcard/it.mp4`, { silent: true });
                                done();
                            });
                        } else {
                            done();
                        }
                    });
                } else {
                    if (Framework.PLATFORM === Framework.ANDROID) {
                        SuiteManager.waitUntilMovieClosed().then(() => {
                            shelljs.exec(`adb -s ${Framework.DEVICE_ID} shell rm /sdcard/it.mp4`, { silent: true });
                            done();
                        });
                    } else {
                        done();
                    }
                }
            });
            after(SuiteManager.initAfter.bind(SuiteManager));
        };
    }
};

export default new SuiteManagerClass();


// async try catch https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/