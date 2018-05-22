import MochaEnhancer from './mochaEnhancer';
import TestParamsParser from './testParamsParser';
import VersionManager from '../versionManager';

MochaEnhancer.init();

var commonUtils = require('./../commonUtils').default;
global.PROJECT_RELATIVE_PATH_SHALLOW = commonUtils.getProjectPathRelativeToFrameworkPath();
global.PROJECT_RELATIVE_PATH = commonUtils.getProjectPathRelativeToFrameworkPath(1);
global.PROJECT_RELATIVE_PATH_DEEP = commonUtils.getProjectPathRelativeToFrameworkPath(2);
global.FRAMEWORK_RELATIVE_PATH_SHALLOW = commonUtils.getFrameworkPathRelativeToProjectPath();
global.FRAMEWORK_RELATIVE_PATH = commonUtils.getFrameworkPathRelativeToProjectPath(1);
global.FRAMEWORK_RELATIVE_PATH_DEEP = commonUtils.getFrameworkPathRelativeToProjectPath(2);
global.PROJECT_CONFIG = require(global.PROJECT_RELATIVE_PATH_DEEP + '.ultimated/config.js').default;
global.PROJECT_NODE_SUITE = VersionManager.getProjectNodeSuite();

global.STORAGE = require(global.PROJECT_RELATIVE_PATH_DEEP + '.ultimated/tests/storage').default;
global.Ultimated = {
    VAULT: {
        FAILED: 0,
        PARAMS: {},
        FLAGS: {}
    }
};

if (PROJECT_CONFIG.defaultParams && PROJECT_CONFIG.defaultParams instanceof Object) {
    Ultimated.VAULT.PARAMS = PROJECT_CONFIG.defaultParams;
}

global.SuiteManager = require('./suiteManager').default;

const envKeys = Object.keys(process.env);

if (envKeys.length) {
    envKeys.forEach((envKey) => {
        if (envKey.includes('ULT_PARAM_')) {
            const paramKey = envKey.replace('ULT_PARAM_', '');
            const paramValue = process.env[envKey];

            Ultimated.VAULT.PARAMS[paramKey] = paramValue;
        }
    });
}

Ultimated.VAULT.FLAGS = TestParamsParser.getUltimatedFlags();


var chai = require('chai');
global.assert = chai.assert;
global.expect = chai.expect;
chai.should();

if (Ultimated.VAULT.FLAGS.spread === true) {
    require(global.PROJECT_RELATIVE_PATH_DEEP + '.ultimated/tests/tests-' + process.env.DEVICE);
} else {
    require(global.PROJECT_RELATIVE_PATH_DEEP + '.ultimated/tests/tests');
}
