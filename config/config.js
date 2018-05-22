const CONFIG = {
    APK_FILE: 'app.apk',
    APP_FILE: 'app.ipa',
    PAGE_OBJECTS_PATH: 'tests/pageObjects',
    FRAMEWORK_WAREHOUSE_FOLDER: '.ultimated',
    MAXIMUM_WAIT_TIMEOUT_SECONDS: 15,
    DEFAULT_WAIT_TIMEOUT_SECONDS: 5,
    NODE_SUITES_ABSOLUTE_PATH: '~/.ultimated/packages/node-suites',
    ULTIMATED_CORE_ABSOLUTE_PATH: '~/.ultimated/packages/ultimated-core',
    SUPPORTED_FLAGS: {
        '--bail': 'BAIL',
        '--afterAll': 'AFTER_ALL',
        '--beforeAll': 'BEFORE_ALL',
        '--singleDevice': 'SINGLE_DEVICE',
        '--saveVisualTestReference': 'saveVisualTestReference',
        '--spread': 'spread',
        '--turboReset': 'turboReset'
    }
};

export default CONFIG;