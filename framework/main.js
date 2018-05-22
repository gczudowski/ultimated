import './dependenciesManager';
import CommunicationManger from './communicationManager';
import ParallelExecutionManager from './parallelExecutionManager';
import TestProjectInitializer from './testProjectInitializer';
import moment from 'moment';

export default (afterAllCallback) => {
    console.log('Starting up...');

    const beginDateTime = moment().format('YYYY-MM-DD_HH-mm');

    CommunicationManger.updateTestSuitesList();
    TestProjectInitializer.init(beginDateTime);
    ParallelExecutionManager.init(afterAllCallback, beginDateTime);
}