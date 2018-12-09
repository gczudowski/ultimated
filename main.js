require('babel-register')({
    "presets": ["es2015", "es2016", "stage-2"]
});

require('babel-polyfill');

var shelljs = require('shelljs');
var fs = require('fs');
var config = require('./config/config').default;

//ensures node_modules link after cloning git repo
if (fs.existsSync('./.ultimated/release-version')) {
    var homeDir = shelljs.exec('cd && pwd', {silent:true}).stdout.trim();
    var projectVersion = fs.readFileSync('./.ultimated/release-version', 'utf8').trim();
    shelljs.exec(`${config.ULTIMATED_CORE_ABSOLUTE_PATH}/latest/update ${projectVersion} download`);
    var nodeSuiteVersion = fs.readFileSync(`${homeDir}/.ultimated/packages/ultimated-core/${projectVersion}/release-node-suite`, 'utf8').trim();

    shelljs.exec(`ln -s ~/.ultimated/packages/node-suites/${nodeSuiteVersion}/lib/node_modules "./.ultimated/node_modules"`, {silent: true});
}

var versionManager = require('./framework/versionManager').default;
var commonUtils = require('./framework/commonUtils').default;
var executionParamsParser = require('./framework/outsideTest/executionParamsParser').default;

// set project relative path
global.Ultimated = {
    VAULT: {
        PROJECT_RELATIVE_PATH_SHALLOW: commonUtils.getProjectPathRelativeToFrameworkPath(),
        PROJECT_RELATIVE_PATH: commonUtils.getProjectPathRelativeToFrameworkPath(1),
        FRAMEWORK_RELATIVE_PATH_SHALLOW: commonUtils.getFrameworkPathRelativeToProjectPath(),
        FRAMEWORK_RELATIVE_PATH: commonUtils.getFrameworkPathRelativeToProjectPath(1),
    },
    FLAGS: {},
    PARAMS: {}
};

process.argv.forEach((argv, index) => {
    if (argv.includes('--')) {
        argv.split(' ').forEach((param) => {
            if (param.includes('--') && config.SUPPORTED_FLAGS[param]) {
                Ultimated.FLAGS[config.SUPPORTED_FLAGS[param]] = true;
            }
        })
    }

    if (argv.includes('-branch')) {
        Ultimated.BRANCH = argv.match(/-branch\s\w+([^\s]+)/g)[0].replace('-branch ', '');
    }

    if (argv.includes('-testsBranch')) {
        Ultimated.TESTS_BRANCH = argv.match(/-testsBranch\s\w+([^\s]+)/g)[0].replace('-testsBranch ', '');
    }
});
Ultimated.PARAMS = executionParamsParser.parseParamsToObject();

function executeTests(afterAllCallback) {
    shelljs.exec(`rm -rf ./.ultimated/tests`);
    shelljs.exec(`rm -rf ./.ultimated/node_modules`, {silent: true});
    shelljs.exec(`rm -rf ./.ultimated/framework.js`, {silent: true});
    shelljs.exec(`rm -rf ./.ultimated/config.js`, {silent: true});
    shelljs.exec(`rm -rf ./screenshot-reference/compare`, {silent: true});
    shelljs.exec(`cp -r tests ./.ultimated`);
    shelljs.exec(`cp config.js ./.ultimated`);
    shelljs.exec(`ln -s ~/.ultimated/packages/node-suites/${nodeSuiteVersion}/lib/node_modules "./.ultimated/node_modules"`, {silent: true});

    // DEPRECATED >>
    global.PROJECT_CONFIG = require(global.PROJECT_RELATIVE_PATH_SHALLOW + '.ultimated/config.js').default;
    global.PROJECT_VERSION = versionManager.getProjectCurrentVersion();
    global.PROJECT_NODE_SUITE = versionManager.getProjectNodeSuite();
    global.FRAMEWORK_CURRENT_VERSION = versionManager.getFrameworkCurrentVersion();
    global.FRAMEWORK_LATEST_VERSION = versionManager.getFrameworkLatestVersion();

    // << DEPRECATED
    Ultimated.VAULT.PROJECT_CONFIG = require(Ultimated.VAULT.PROJECT_RELATIVE_PATH_SHALLOW + '.ultimated/config.js').default;
    Ultimated.VAULT.PROJECT_VERSION = versionManager.getProjectCurrentVersion();
    Ultimated.VAULT.PROJECT_NODE_SUITE = versionManager.getProjectNodeSuite();
    Ultimated.VAULT.FRAMEWORK_CURRENT_VERSION = versionManager.getFrameworkCurrentVersion();
    Ultimated.VAULT.FRAMEWORK_LATEST_VERSION = versionManager.getFrameworkLatestVersion();
    versionManager.ensureLatestFrameworkVersion();

    versionManager.informAboutNewerVersion();

    require(`./../${Ultimated.VAULT.PROJECT_VERSION}/framework/main.js`).default(afterAllCallback);
}

global.PROJECT_RELATIVE_PATH_SHALLOW = commonUtils.getProjectPathRelativeToFrameworkPath();
global.PROJECT_RELATIVE_PATH = commonUtils.getProjectPathRelativeToFrameworkPath(1);
global.FRAMEWORK_RELATIVE_PATH_SHALLOW = commonUtils.getFrameworkPathRelativeToProjectPath();
global.FRAMEWORK_RELATIVE_PATH = commonUtils.getFrameworkPathRelativeToProjectPath(1);

//TODO add all ifs to a class, refactor to switch

if (process.argv[2] === 'create' && process.argv[3]) { // if ultimated is run with "create"
    shelljs.exec(`~/.ultimated/packages/ultimated-core/latest/create.sh create ${process.argv[3]}`);
} else if (process.argv[2] === 'install' && process.argv[3] === 'android') {
    console.log('If you haven\'t installed Android SDK or Java on your system yet');
    console.log('to do so, type:');
    console.log('  bash <( curl http://ultimatedtesting.com/install/android )');
} else if (process.argv[2] === 'update' && fs.existsSync('./.ultimated/release-version')) {
    Ultimated.VAULT.FRAMEWORK_LATEST_VERSION = versionManager.getFrameworkLatestVersion();
    console.log('Updating project to version', Ultimated.VAULT.FRAMEWORK_LATEST_VERSION);
    versionManager.ensureLatestFrameworkVersion();
    shelljs.exec('rm ./.ultimated/release-version');
    shelljs.exec('touch ./.ultimated/release-version');
    fs.writeFileSync('./.ultimated/release-version', Ultimated.VAULT.FRAMEWORK_LATEST_VERSION);
    console.log('');
    console.log('Project updated. To run the project, type');
    console.log('  ultimated');
    console.log('');
} else if (fs.existsSync('./.ultimated/release-version')) {
    if (Ultimated.FLAGS.BEFORE_ALL && fs.existsSync('./beforeAll.sh')) {
        console.log(`Running command -> ./beforeAll.sh ${Ultimated.BRANCH} ${Ultimated.TESTS_BRANCH}`);
        const response = shelljs.exec(`./beforeAll.sh ${Ultimated.BRANCH} ${Ultimated.TESTS_BRANCH}`);

        if (response.stderr) {
            console.log('Error in BeforeAll script! I would exit but exit is disabled for now!', response.stderr);
            // process.exit(1);
        }
    } else if (Ultimated.FLAGS.BEFORE_ALL) {
        console.log('You used --beforeAll flag, but the beforeAll.sh file is missing');
    }

    if (Ultimated.FLAGS.AFTER_ALL && fs.existsSync('./afterAll.sh')) {
        executeTests((beginDateTime, deviceId, port) => {
            const reportsDir = `reports/${beginDateTime}`;
            const logsDir = `logs/${beginDateTime}-${port}`;

            if (fs.existsSync('./afterAll.sh')) {
                console.log('Executing afterAll.sh script...');
                // TODO give arguments here as variables e.g "BRANCH=branch_name LOGS_DIR=logs_dir bash afterAll.sh"
                shelljs.exec(`./afterAll.sh ${reportsDir} ${logsDir} ${Ultimated.BRANCH} ${beginDateTime} ${deviceId}`);
            }
        });
    }  else if (Ultimated.FLAGS.AFTER_ALL) {
        console.log('You used --afterAll flag, but the afterAll.sh file is missing');
        executeTests();
    } else {
        executeTests();
    }
} else if (!fs.existsSync('./.ultimated/release-version')) { // TODO and if second argument given is not a flag
    console.log('\nThis command can only be run from the project directory\n');
    console.log('');
    console.log('Would you like to create a new project? Type:');
    console.log('  ultimated create project_name\n');
} else {
    console.log('Ultimated: command unknown');
}