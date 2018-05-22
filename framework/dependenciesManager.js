import fs from 'fs';
import shelljs from 'shelljs';
import CONFIG from './../config/config';
import CommonUtils from './commonUtils';

const DependenciesManager = class {
    constructor() {
        this.buildFrameworkObject();
        //this.buildFrameworkAutocomplete();
        this.createXCodeConfig();
    }

    buildFrameworkAutocomplete() {
        const path = `${CONFIG.FRAMEWORK_WAREHOUSE_FOLDER}/${CONFIG.PAGE_OBJECTS_PATH}`;

        let fileContent = '';

        const files = CommonUtils.getAllFilesFromDirectory(path);

        fileContent += `export as namespace Framework {\n`;
        files.forEach((pageObjectClass, pageObjectIndex) => {
            fileContent += `    interface ${pageObjectClass.fileName} {\n`;

            let methods;
            methods = this.getAllMethods(require(`./${pageObjectClass.path}`).default);

            methods.forEach((methodName, methodIndex) => {
                fileContent += `        ${methodName}(): void;\n`;
            });

            fileContent += '    }\n';
        });
        fileContent += `}`;

        fs.writeFile("framework/autocomplete/framework.d.ts", fileContent, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }

    async buildFrameworkObject() {
        const path = `${CONFIG.FRAMEWORK_WAREHOUSE_FOLDER}/${CONFIG.PAGE_OBJECTS_PATH}`;

        let fileContent = '';

        const files = CommonUtils.getAllFilesFromDirectory(path);
        files.forEach((pageObjectData) => {
            fileContent += `import ${pageObjectData.fileName} from '.${pageObjectData.path.replace(CONFIG.FRAMEWORK_WAREHOUSE_FOLDER, '')}';\n`;
        });

        fileContent += `\nexport default {\n`;
        files.forEach((pageObjectClass, pageObjectIndex) => {
            fileContent += `    ${pageObjectClass.fileName}: {\n`;

            let methods;
            // methods = this.getAllMethods(require(`${PROJECT_RELATIVE_PATH}${pageObjectClass.path}`).default);

            const pageObjectInstance = require(`${PROJECT_RELATIVE_PATH}${pageObjectClass.path}`).default;
            methods = this.getAllMethodsExtended(pageObjectInstance);

            methods.forEach((methodName, methodIndex) => {
                if (this.isMethodAsync(pageObjectInstance[methodName])) {
                    fileContent += `        ${methodName}: (arg1, arg2, arg3) => { return new Promise((resolve, reject) => { const functionReturnValue = ${pageObjectClass.fileName}.${methodName}.call(${pageObjectClass.fileName}, arg1, arg2, arg3); if (functionReturnValue.then) { functionReturnValue.then((arg1) => { resolve(arg1); }).catch((err) => { if (!global.finalError) { global.finalError = 'Error in ${pageObjectClass.fileName}.${methodName}! ' + err; } ;console.log(''); console.log('Error in ${pageObjectClass.fileName}.${methodName}! ' + err); reject(err); }); } else { resolve(functionReturnValue); } }); }`;
                } else {
                    fileContent += `        ${methodName}: (arg1, arg2, arg3) => { let value; try { value = ${pageObjectClass.fileName}.${methodName}.call(${pageObjectClass.fileName}, arg1, arg2, arg3); } catch(err) { if (!global.finalError) { global.finalError = 'Error in ${pageObjectClass.fileName}.${methodName}! ' + err; } console.log(''); console.log('Error in ${pageObjectClass.fileName}.${methodName}! ' + err); } return value; }`;
                }

                if (methodIndex === methods.length - 1) {
                    fileContent += '\n';
                } else {
                    fileContent += ',\n';
                }
            });

            if (pageObjectIndex === files.length - 1) {
                fileContent += '    }\n';
            } else {
                fileContent += '    },\n';
            }
        });
        fileContent += `};`;

        fs.writeFile(".ultimated/framework.js", fileContent, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }

    getAllMethods(object) {
        const methods = [];

        if (object) {
            for (let name of Object.getOwnPropertyNames(Object.getPrototypeOf(object))) {
                let method = object[name];
                if ((!(method instanceof Function) || method === object)) continue;
                if (name !== 'constructor') {
                    methods.push(name);
                }
            }
        }

        return methods;
    }

    getAllMethodsExtended(obj) {
        const FORBIDDEN_KEYS = {
            constructor: true,
            hasOwnProperty: true,
            toString: true,
            toLocaleString: true,
            valueOf: true,
            isPrototypeOf: true,
            propertyIsEnumerable: true,
            __proto__: true,
            __defineGetter__: true,
            __defineSetter__: true,
            __lookupGetter__: true,
            __lookupSetter__: true
        };

        let methods = [];
        while (obj = Reflect.getPrototypeOf(obj)) {
            let keys = Reflect.ownKeys(obj);

            keys.forEach((key) => {
                if (!FORBIDDEN_KEYS[key]) {
                    methods.push(key)
                }
            });
        }

        return methods;
    }

    isMethodAsync(method) {
        const methodBody = String(method);

        return methodBody.indexOf('.apply(this, arguments);') > 0 && methodBody.indexOf('return _ref') > 0;
    }

    createXCodeConfig() {
        let appleDevelopmentTeamId ;

        if (PROJECT_CONFIG && PROJECT_CONFIG.certificates && PROJECT_CONFIG.certificates.appleDevelopmentTeamId) {
            appleDevelopmentTeamId = PROJECT_CONFIG.certificates.appleDevelopmentTeamId
        } else {
            appleDevelopmentTeamId = 'YOUR_DEV_TEAM_ID';
        }

        const fileContent = `DEVELOPMENT_TEAM = ${appleDevelopmentTeamId}\nCODE_SIGN_IDENTITY = iPhone Developer`;

        fs.writeFile(`${global.FRAMEWORK_RELATIVE_PATH}/xcode.conf`, fileContent, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }


};

export default new DependenciesManager();
