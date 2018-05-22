import shelljs from 'shelljs';
import request from 'sync-request';
import vc from 'version_compare';
import fs from 'fs';
import CONFIG from './../config/config';

const VersionManager = class {
    constructor () {
        console.log('Checking for updates...');
    }
    showUpdateNotification() {
        return __dirname.replace(/\\framework/, '').replace(/\/framework/, '');
    }

    getProjectCurrentVersion() {
        return fs.readFileSync('./.ultimated/release-version', 'utf8').trim();
    }

    getProjectNodeSuite() {
        const projectVersion = fs.readFileSync('./.ultimated/release-version', 'utf8').trim();

        return fs.readFileSync(`${FRAMEWORK_RELATIVE_PATH.replace('/framework/', '')}/release-node-suite`, 'utf8').trim();
    }

    getFrameworkCurrentVersion() {
        let latestPath = FRAMEWORK_RELATIVE_PATH.replace('/framework/', '');
        const versionIndex = latestPath.lastIndexOf('/');
        latestPath = latestPath.substring(0, versionIndex);
        latestPath = `${latestPath}/latest`;

        return fs.readFileSync(`${latestPath}/release-version`, 'utf8').trim();
    }

    getFrameworkLatestVersion() {
        const response = request('GET', `http://ultimatedtesting.com/latest`);

        if (response.statusCode === 200) {
            return response.getBody('utf8').trim();
        } else {
            return null;
        }
    }

    ensureProperFrameworkVersion() {
        shelljs.exec(`${CONFIG.ULTIMATED_CORE_ABSOLUTE_PATH}/latest/update ${Ultimated.VAULT.PROJECT_VERSION} download`);
    }

    ensureLatestFrameworkVersion() {
        shelljs.exec(`${CONFIG.ULTIMATED_CORE_ABSOLUTE_PATH}/latest/update ${Ultimated.VAULT.FRAMEWORK_LATEST_VERSION} latest`);
    }

    informAboutNewerVersion() {
        if (vc.lt(Ultimated.VAULT.PROJECT_VERSION, Ultimated.VAULT.FRAMEWORK_LATEST_VERSION)) {
            console.log('');
            console.log('A newer version of Ultimated is available');
            console.log('In order to update your project, type');
            console.log('  ultimated update');
            console.log('');
        }
    }
};

export default new VersionManager();