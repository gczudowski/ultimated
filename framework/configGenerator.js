import CommonUtils from './commonUtils';
import CONFIG from './../config/config';

const ConfigGenerator = class {
    constructor () {
        this.config = CONFIG;
        this.config.APK_PATH = `${PROJECT_RELATIVE_PATH_SHALLOW}apk/${this.config.APK_FILE}`;
        this.config.APP_PATH = `${PROJECT_RELATIVE_PATH_SHALLOW}apk/${this.config.APP_FILE}`;
        this.config.PORT_MIN = 4100;
        this.config.MAXIMUM_WAIT_TIMEOUT_MS = this.config.MAXIMUM_WAIT_TIMEOUT_SECONDS * 1000;
        this.config.DEFAULT_WAIT_TIMEOUT_MS = this.config.DEFAULT_WAIT_TIMEOUT_SECONDS * 1000;
        this.config.XCODE_CONFIG = `${CommonUtils.getMainPath()}/framework/xcode.conf`;

        return this.config;
    }
};

export default new ConfigGenerator();
