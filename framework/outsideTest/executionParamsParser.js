const ExecutionParamsParser = class {
    parseParamsToObject () {
        let allParams = {};

        process.argv.forEach((singleArgvLine, index) => {
            if (singleArgvLine.includes(' ') && singleArgvLine.includes('-')) {
                allParams = this.getAllParamNames(singleArgvLine);
            }
        });

        return allParams;
    }

    getAllParamNames(argv) {
        const params = argv.match(/-\w+([^\s]+)/g);
        const parsedParamNames = {};

        if (params && params.length) {
            params.forEach((param) => {
                const paramKey = param.replace('-', '');

                const regex = new RegExp(param + '\\s\\w+([^\\s]+)', 'g');
                let temp = argv.match(regex);

                if (temp && temp[0]) {
                    parsedParamNames[paramKey] = temp[0].replace(param + ' ', '');
                }
            });
        }

        return parsedParamNames;
    }
};

export default new ExecutionParamsParser();