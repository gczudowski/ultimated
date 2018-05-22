import shelljs from 'shelljs';

const DevicesConnectionManager = class {
    constructor() {
        this.androidDevicesConnectedCount = null;
        this.connectionManagerTimeout = null;
    }

    monitorDevicesConnection() {
        const currentAndroidDevicesConnectedCount = this.getAndroidDevicesList().length;

        if (currentAndroidDevicesConnectedCount !== this.androidDevicesConnectedCount && this.androidDevicesConnectedCount !== null) {
            console.log(`Connected devices number changed. Used to be: ${this.androidDevicesConnectedCount}, now it's: ${currentAndroidDevicesConnectedCount}`);
        }

        // if (this.androidDevicesConnectedCount !== 0) {
            this.connectionManagerTimeout = setTimeout(this.monitorDevicesConnection.bind(this), 10);
        // }

        if (currentAndroidDevicesConnectedCount !== this.androidDevicesConnectedCount || this.androidDevicesConnectedCount === null) {
            this.androidDevicesConnectedCount = currentAndroidDevicesConnectedCount;
        }
    }

    getAndroidDevicesList () {
        shelljs.exec(`adb devices`, {silent:true});

        let response = shelljs.exec(`adb devices`, {silent:true});

        response = response.stdout.replace('List of devices attached', '');
        response = response.replace(/(\r\n|\n|\r|\t)/gm, '');
        response = response.replace(/\s+/g, '');
        response = response.split('device');
        response.pop();

        return response;
    }

    getIOSDevicesList () {
        let response = shelljs.exec(`instruments -s devices`, {silent:true});
        let devices = [];

        response = response.stdout.replace('Known Devices:', '');
        response = response.split('\n');

        for (let i = response.length; i--;) {
            if (response[i].indexOf('Simulator') === -1 && response[i].length !== 0) {
                let parsedResponse = response[i].substring(response[i].indexOf('[') + 1);
                parsedResponse = parsedResponse.substring(0, parsedResponse.indexOf(']'));
                if (parsedResponse.indexOf('-') === -1) {
                    devices.push(parsedResponse);
                }
            }
        }

        return devices;
    }

    stop() {
        if (this.connectionManagerTimeout) {
            clearTimeout(this.connectionManagerTimeout);
            this.connectionManagerTimeout = null;
        }
    }
};

export default new DevicesConnectionManager();