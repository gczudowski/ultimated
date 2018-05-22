import shelljs from 'shelljs';
import request from 'request';
import CommonUtils from './commonUtils';
import CONFIG from './configGenerator';
import moment from 'moment';
import CommunicationManager from
    './communicationManager';
import fs from 'fs';
import DevicesConnectionManager from './devicesConnectionManager'
import SpreadSuiteParser from './outsideTest/spreadSuiteParser'
import ReportCreator from './insideTest/reportCreator';

const ParallelExecutionManager = class {
    constructor () {
        this.activeDevicesList = {};

        this.allDone = null;
        this.exitCode = 0;
    }

    init (afterAllCallback, beginDateTime) {
        this.beginDateTime = beginDateTime;
        this.afterAllCallback = afterAllCallback;

        this.resetAppium();
        this.startTestsOnAllDevices();
        DevicesConnectionManager.monitorDevicesConnection();
    }

    resetAppium () {
        shelljs.exec(`${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/node ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/forever stopall`, {silent:true});
    }

    startTestsOnAllDevices () {
        console.log('Please wait a moment, initiating tests on all connected devices...');
        const androidDevicesIdList = DevicesConnectionManager.getAndroidDevicesList();
        const iosDevicesIdList = DevicesConnectionManager.getIOSDevicesList();

        SpreadSuiteParser.parseSuitesForDevices(androidDevicesIdList, iosDevicesIdList);

        this.startTestsOnAndroidDevices(androidDevicesIdList);
        this.startTestsOnIOSDevices(iosDevicesIdList);
        // this.startTestsOnIOSSimulators();

        if (Object.keys(this.activeDevicesList).length === 0) {
            console.log('No devices connected. Killing...');
            process.exit(0);
        }
    }

    startTestsOnAndroidDevices (devicesIdList) {
        // const devicesIdList = DevicesConnectionManager.getAndroidDevicesList();

        console.log(`Android devices connected: ${devicesIdList.length}`);
        this.androidDevicesConnectedCount = devicesIdList.length;

        if (devicesIdList.length && !fs.existsSync(`./apk/${CONFIG.APK_FILE}`)) {
            console.log(`Error! Please put your apk file at ./apk/${CONFIG.APK_FILE}`);

            process.exit(1);
        }

        for (let i = devicesIdList.length; i--;) {
            const port = CONFIG.PORT_MIN + i;
            const deviceId = devicesIdList[i];

            shelljs.exec(`mkdir reports/${this.beginDateTime}/${deviceId}`, {silent:true});

            this.runAppium(port, deviceId);
            this.runTest(deviceId, port, 'Android');
        }
    }

    runAppium (port, deviceId) {
        shelljs.exec(`${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/node ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/forever start -o logs/${this.beginDateTime}-${port} -a --sourceDir "${CommonUtils.getMainPath()}" --tmp "${CommonUtils.getMainPath()}/reports/${this.beginDateTime}/${deviceId}" --uid "${deviceId}-port${port}" "/node_modules/appium/build/lib/main.js" --port ${port} -bp ${port+100} --chromedriver-port ${port+200} --webkit-debug-proxy-port ${port+300}`, {silent:true});
    }

    runTest (deviceId, port, platform, resolve) {
        this.activeDevicesList[deviceId] = deviceId;

        request(`http://127.0.0.1:${port}`, (error, response, body) => {
            if (!error && response.statusCode === 404) {
                let paramsString = '';

                const params = Object.keys(Ultimated.PARAMS);
                if (params && params.length) {
                    params.forEach((paramKey) => {
                        const paramValue = Ultimated.PARAMS[paramKey];

                        paramsString = `${paramsString} ULT_PARAM_${paramKey.replace(' ', '')}=${paramValue}`;
                    });
                }

                const flags = Object.keys(Ultimated.FLAGS);
                if (flags && flags.length) {
                    flags.forEach((flagKey) => {
                        const paramValue = true;

                        paramsString = `${paramsString} ULT_FLAG_${flagKey.replace(' ', '')}=${paramValue}`;
                    });
                }

                paramsString = `${paramsString} ULT_FLAG_FRAMEWORK_LATEST_VERSION=${Ultimated.VAULT.FRAMEWORK_LATEST_VERSION}`;

                const shelljsObject = shelljs.exec(`env DEVICE=${deviceId} PORT=${port} PLATFORM=${platform} DATETIME=${this.beginDateTime}${paramsString} ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/node ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/mocha -R good-mocha-html-reporter -p ./reports/${this.beginDateTime}/${deviceId}.html --timeout 600000 ${Ultimated.FLAGS.BAIL ? '--bail' : ''} ${CONFIG.ULTIMATED_CORE_ABSOLUTE_PATH}/${global.PROJECT_VERSION}/framework/insideTest/main.js`, {silent:false}, (code) => {
                    console.log(`Test (device: ${deviceId}, port: ${port}) has just finished`);
                    shelljs.exec(`${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/forever stop ${deviceId}-port${port}`, {silent:true});
                    CommunicationManager.updateTestStatus(deviceId);

                    if (code !== this.exitCode && this.exitCode === 0) {
                        this.exitCode = code;
                    }

                    delete this.activeDevicesList[deviceId];
                    console.log('devices left: ', Object.keys(this.activeDevicesList).length);


                    //COMBINED REPORTS >>>
                    const combinedReportFiles = CommonUtils.getAllFilesFromDirectory(`${shelljs.exec('pwd', {silent: true}).stdout.trim()}/reports/${this.beginDateTime}/combinedReportData`);
                    let finalReportData = { items: [], map: {}, oryginalMap: {} };
                    combinedReportFiles.forEach((directoryObject) => {
                        const indexBonus = finalReportData.items.length;

                        const data = JSON.parse(fs.readFileSync(`./reports/${this.beginDateTime}/combinedReportData/${directoryObject.fileName}`, 'utf8').trim());

                        Object.keys(data.map).forEach((describeName) => {
                            Object.keys(data.map[describeName]).forEach((itName) => {
                                if (!finalReportData.oryginalMap[describeName]) {
                                    finalReportData.oryginalMap[describeName] = {};
                                }
                                finalReportData.oryginalMap[describeName][itName] = data.map[describeName][itName];

                                data.map[describeName][itName] = data.map[describeName][itName] + indexBonus;
                            });
                        });

                        finalReportData.map = {
                            ...finalReportData.map,
                            ...data.map
                        };
                        data.items.map((mapItem) => {
                            finalReportData.items.push(mapItem);
                        });
                    });
                    ReportCreator.createReport({
                        ...finalReportData,
                        deviceId,
                        beginDateTime: this.beginDateTime,
                        finalReport: true
                    });
                    // <<< COMBINED REPORTS

                    if (Ultimated.FLAGS.BAIL && code !== 0) {
                        console.log('one of the tests failed, killing with code...', code);
                        DevicesConnectionManager.stop();
                        if (this.afterAllCallback) {
                            this.afterAllCallback(this.beginDateTime, deviceId, port);
                        }
                        setTimeout(() => {
                            console.log(`killed with code ${code}!`);
                            process.exit(code);
                        }, 3000);
                    } else if (Object.keys(this.activeDevicesList).length === 0) {
                        // const exitCode = Ultimated.VAULT.FAILED > 0 ? 1 : 0;
                        console.log('killing with code...', this.exitCode);
                        DevicesConnectionManager.stop();
                        if (this.afterAllCallback) {
                            this.afterAllCallback(this.beginDateTime, deviceId, port);
                        }
                        setTimeout(() => {
                            console.log('killed!');
                            process.exit(this.exitCode);
                        }, 3000);
                    }

                    if (resolve) {
                        resolve();
                    }
                });
            } else {
                setTimeout((() => {
                    this.runTest.call(this, deviceId, port, platform, resolve);
                }).bind(this), 3000)
            }
        });
    }

    runTestSync (deviceId, port, platform) {
        return new Promise((resolve) => {
            this.runTest(deviceId, port, platform, resolve);
        });
    }

    startTestsOnIOSDevices (devicesIdList) {
        // const devicesIdList = DevicesConnectionManager.getIOSDevicesList();

        console.log('iOS devices connected: ', devicesIdList.length);

        if (devicesIdList.length && !fs.existsSync(`./apk/${CONFIG.APP_FILE}`)) {
            console.log(`Error! Please put your ipa file at ./apk/${CONFIG.APP_FILE}`);

            process.exit(1);
        }

        // console.log('Killing all ios debug proxy instances...');
        // shelljs.exec(`killall ios_webkit_debug_proxy`, {silent:true});

        for (let i = devicesIdList.length; i--;) {
            const port = CONFIG.PORT_MIN + 1000 + i;
            const deviceId = devicesIdList[i];

            shelljs.exec(`mkdir reports/${this.beginDateTime}/${deviceId}`, {silent:true});
            // TODO fix ios, async is not closing
            // shelljs.exec(`ios_webkit_debug_proxy -c ${deviceId}:${port+300} -d`, {silent: true, async: true});

            this.runAppium(port, deviceId);
            this.runTest(deviceId, port, 'iOS');
        }
    }

    async startTestsOnIOSSimulators () {
        const iOSSimulatorsList = this.getIOSSimulatorsList();

        for (let i = iOSSimulatorsList.length; i--;) {
            const port = CONFIG.PORT_MIN + 2000 + i;
            const device = iOSSimulatorsList[i];

            shelljs.mkdir(`reports/${this.beginDateTime}/${device}`);

            this.runAppium(port);
            await this.runTestSync(device, port, 'iOS');
        }
    }

    getIOSSimulatorsList () {
        let response = shelljs.exec(`instruments -s devices`, {silent:true});
        let devices = [];

        response = response.stdout.replace('Known Devices:', '');
        response = response.split('\n');

        for (let i = 0; devices.length < 4; i++) {
            if (response[i].indexOf('Simulator') !== -1 && response[i].length !== 0
                && response[i].indexOf('iPhone') !== -1 && response[i].indexOf('iPhone 4') === -1) {
                let parsedResponse = response[i].substring(response[i].indexOf('[') + 1);
                parsedResponse = parsedResponse.substring(0, parsedResponse.indexOf(']'));
                devices.push(parsedResponse);
            }
        }

        console.log('iPhone simulators available: ', devices.length);

        return devices;
    }
};

export default new ParallelExecutionManager();
