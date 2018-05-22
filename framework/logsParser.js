import fs from 'fs';

const LogsParser = class {
    constructor() {
        this.knownErrors = {
            ZERO_DEVICES_ERROR: (logFileBody) => {
                return {
                    isError: logFileBody.indexOf('[ADB] 0 device(s) connected') > 0,
                    message: `Detected possible ADB CONNECTION ISSUE! Tip: Make sure you didn't disconnect the device by accident! If issue persists, try connecting your device to a usb 2.0 port or use a usb 2.0 hub.`
                };
            },
            STACK_OVERFLOW_ERROR: (logFileBody) => {
                return {
                    isError: logFileBody.indexOf('shortMsg=java.lang.StackOverflowError') > 0,
                    message: 'Detected possible ANDROID WATCHERS ISSUE! Tipe: Make sure you have disableAndroidWatchers desired capability set to true!'
                }
            },
            CONNECTION_REFUSED_ERROR: (logFileBody) => {
                return {
                    isError: logFileBody.indexOf('connect ECONNREFUSED') > 0,
                    message: 'Detected possible APPIUM CONNECTION ISSUE! Tip: Make sure you have no other processes running between ports 3000-5000!'
                }
            },
            SCREEN_LOCKED_ERROR: () => (logFileBody) => {
                return {
                    isError: logFileBody.split('Screen is locked, trying to unlock').length > 5,
                    message: 'Detected possible SCREEN UNLOCK ISSUE! Tip: If problem persists, turn off the screen lock option on your device and set the skipUnlock desired capability to true!'
                }
            },
            IOS_SIGNING_ERROR: () => (logFileBody) => {
                return {
                    isError: logFileBody.indexOf(`xcodebuild exited with code '65' and signal 'null'`) > 0,
                    message: `Detected possible IOS SIGNING ISSUE! Tip: Set your team's id in project config -> certificates.appleDevelopmentTeamId`
                }
            }
        }
    }

    checkLogFileForKnownErrors(logFileName) {
        const logsFileBody = fs.readFileSync(`logs/${logFileName}`, 'utf-8');

        Object.keys(this.knownErrors).forEach((errorSymbol, errorIndex) => {
            const errorCheckerObject = this.knownErrors[errorSymbol](logsFileBody);

            if (errorCheckerObject.isError) {
                console.log(errorCheckerObject.message);
            }
        });
    }
};

export default new LogsParser();