import shelljs from 'shelljs';

const TestProjectInitializer = class {
    init (beginDateTime) {
        this.beginDateTime = beginDateTime;

        this.prepareFolders();
    }

    prepareFolders () {
        shelljs.exec(`mkdir reports`, {silent:true});
        shelljs.exec(`mkdir screenshot-reference`, {silent:true});
        shelljs.exec(`mkdir reports/${this.beginDateTime}`, {silent:true});
        shelljs.exec(`mkdir logs`, {silent:true});
    }
};

export default new TestProjectInitializer();