import fs from 'fs';

const SpreadSuiteParser = class {
    parseSuitesForDevices(androidDevicesIdList, iosDevicesIdList) {
        const devicesCount = this.getSpreadDevicesCount(androidDevicesIdList, iosDevicesIdList);
        const devicesList = this.getSpreadDevicesList(androidDevicesIdList, iosDevicesIdList);

        const testsFileLines = this.getTestsFileContent();
        const commonContentLines = this.getCommonContentLines(testsFileLines);
        const suitesLines = this.getSuitesLines(testsFileLines);
        const spreadSuitesLines = this.spreadSuitesLines(suitesLines, devicesCount);

        devicesList.map((deviceId, index) => {
            const preparedFileContent = this.prepareFileContent(commonContentLines, spreadSuitesLines[index]);

            fs.writeFileSync(`./.ultimated/tests/tests-${deviceId}.js`, preparedFileContent);
        });
    }

    getTestsFileContent() {
        const data = fs.readFileSync('tests/tests.js', 'utf8');

        return data.split('\n');
    }

    getCommonContentLines(linesArray) {
        let configs = [];

        linesArray.forEach((line) => {
            if (!line.includes('/suites/')) {
                configs.push(line);
            }
        });

        return configs;
    }

    getSuitesLines(linesArray) {
        let suites = [];

        linesArray.forEach((line) => {
            if (line.includes('/suites/')) {
                suites.push(line);
            }
        });

        return suites;
    }

    spreadSuitesLines(suitesLines, devicesCount) {
        const suitesLinesCount = suitesLines.length;
        const chunkCount = Math.ceil(suitesLinesCount / devicesCount);

        const doChunk = (list, size) => list.reduce((r, v) =>
            (!r.length || r[r.length - 1].length === size ?
                r.push([v]) : r[r.length - 1].push(v)) && r
            , []);

        return doChunk(suitesLines, chunkCount);
    }


    getSpreadDevicesCount(androidDevicesIdList, iosDevicesIdList) {
        return androidDevicesIdList.length + iosDevicesIdList.length;
    }

    getSpreadDevicesList(androidDevicesIdList, iosDevicesIdList) {
        const devicesList = androidDevicesIdList.concat(iosDevicesIdList);

        return devicesList.map(x => [Math.random(), x]).sort(([a], [b]) => a - b).map(([_, x]) => x);
        // return devicesList.sort(() => Math.random() - 0.5);
    }

    prepareFileContent(commonContentLines, spreadSuitesLines) {
        let string = '';

        commonContentLines.map((line) => {
            if (string !== '') {
                string = `${string}\n${line}`;
            } else {
                string = line;
            }
        });

        spreadSuitesLines.map((line) => {
            if (string !== '') {
                string = `${string}\n${line}`;
            } else {
                string = line;
            }
        });

        return string;
    }
};

export default new SpreadSuiteParser();