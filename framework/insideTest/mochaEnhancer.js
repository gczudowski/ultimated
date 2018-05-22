const MochaEnhancer = class {
    init() {
        this.enhanceMocha();
    }

    enhanceMocha() {
        global.oryginalIt = global.it;
        global.newIt = null;
        global.it = null;
        global.oryginalXIt = global.xit;
        global.oryginalDescribe = global.describe;
        global.describe = null;

        global.it = (description, func, params) => {
            const require = [];
            const exclude = [];
            const tryCatchFunc = () => {
                return new Promise((resolve, reject) => {
                    func()
                        .then(() => {
                            resolve();
                        })
                        .catch((err) => {
                            if (!global.finalError && err) {
                                global.finalError = err;
                            }

                            reject(err);
                        });
                });
            };

            if (!params || (params && !params.overwritten)) {
                if (this.isItParamsMet(params)) {
                    this.executeBeforeSuite(params);
                    this.addReportRecord(description);

                    return global.oryginalIt(description, tryCatchFunc, { overwritten: true });
                } else {
                    const finalDescription = `[PARAMS NOT MET] ${description}`;

                    return global.xit(finalDescription, func);
                }
            }
        };

        global.xit = (description, func) => {
            this.addReportRecord(description);

            global.newIt = global.it;
            global.it = null;
            global.it = global.oryginalIt;

            global.oryginalXIt(description, func);

            global.it = null;
            global.it = global.newIt;
        };

        global.describe = (title, func) => {
            global.lastDescribeTitle = title;
            global.oryginalDescribe(title, func);
        }
    }

    addReportRecord(description) {
        const index = SuiteManager.reportData.items.push({
            parent: {
                title: global.lastDescribeTitle
            },
            title: description,
            state: 'pending',
            deviceId: SuiteManager.deviceId
        });
        if (!SuiteManager.reportData.map[global.lastDescribeTitle]) {
            SuiteManager.reportData.map[global.lastDescribeTitle] = {};
        }
        SuiteManager.reportData.map[global.lastDescribeTitle][description] = index - 1;
    }

    isItParamsMet(params) {
        const parsedParams = this.parseItParams(params);

        return this.isRequireParamsMet(parsedParams) && this.isExcludeParamsMet(parsedParams);
    }

    isRequireParamsMet(parsedParams) {
        const requireParamsStatus = {};
        let isRequireParamsMet = true;

        Object.keys(parsedParams.require).forEach((paramKey) => {
            requireParamsStatus[paramKey] = false;

            parsedParams.require[paramKey].forEach((paramSingleValue) => {
                if (Framework.PARAMS[paramKey] === paramSingleValue) {
                    requireParamsStatus[paramKey] = true;
                }
            });
        });

        Object.keys(requireParamsStatus).forEach((paramKey) => {
            if (requireParamsStatus[paramKey] === false) {
                isRequireParamsMet = false;
            }
        });

        return isRequireParamsMet;
    }

    isExcludeParamsMet(parsedParams) {
        const excludeParamsStatus = {};
        let isExcludeParamsMet = true;

        Object.keys(parsedParams.exclude).forEach((paramKey) => {
            excludeParamsStatus[paramKey] = true;

            parsedParams.exclude[paramKey].forEach((paramSingleValue) => {
                if (Framework.PARAMS[paramKey] === paramSingleValue) {
                    excludeParamsStatus[paramKey] = false;
                }
            });
        });

        Object.keys(excludeParamsStatus).forEach((paramKey) => {
            if (excludeParamsStatus[paramKey] === false) {
                isExcludeParamsMet = false;
            }
        });

        return isExcludeParamsMet;
    }

    parseItParams(params) {
        const parsedParams = {
            require: {},
            exclude: {}
        };

        if (params && params.require && params.require instanceof Object && params.require.constructor === Object) {
            Object.keys(params.require).forEach((key) => {
                const value = params.require[key];
                if (typeof value === 'string') {
                    parsedParams.require[key] = [value];
                } else {
                    parsedParams.require[key] = value;
                }
            });
        }

        if (params && params.exclude && params.exclude instanceof Object && params.exclude.constructor === Object) {
            Object.keys(params.exclude).forEach((key) => {
                const value = params.exclude[key];
                if (typeof value === 'string') {
                    parsedParams.exclude[key] = [value];
                } else {
                    parsedParams.exclude[key] = value;
                }
            });
        }

        return parsedParams;
    }

    executeBeforeSuite(params) {
        if (params && params.executeBefore && Array.isArray(params.executeBefore)) {
            params.executeBefore.forEach((func) => {
                func()
            })
        } else if (params && params.executeBefore && !Array.isArray(params.executeBefore) && typeof(params.executeBefore) === 'function') {
            params.executeBefore();
        }
    }
};

export default new MochaEnhancer();