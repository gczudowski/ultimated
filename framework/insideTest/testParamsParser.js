const TestParamsParser = class {
    parseUltimatedFlagsToObject() {
        const flags = {};
        const envKeys = Object.keys(process.env);

        if (envKeys.length) {
            envKeys.forEach((envKey) => {
                if (envKey.includes('ULT_FLAG_')) {
                    const paramKey = envKey.replace('ULT_FLAG_', '');

                    flags[paramKey] = true;
                }
            });
        }

        return flags;
    }

    getUltimatedFlags() {
        const configFlags = PROJECT_CONFIG.ultimatedConfig || {};

        return {
            ...configFlags,
            ...this.parseUltimatedFlagsToObject()
        }
    }
};

export default new TestParamsParser();