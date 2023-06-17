import {MunchkinServer} from './server/index';
import {Logger} from "./common/logger";
import config from "./config";


const logger = new Logger('ROOT');

const server = new MunchkinServer({timeout: 2000});
server.start(config.port, config.hostname);
server.on('message', (data) => {
    logger.log('Received from client', data);
})
server.on('error', (data) => {
    logger.error('Error', data)
})
