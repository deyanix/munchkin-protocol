import {MunchkinClient} from "./client";
import {Logger} from "./common/logger";
import config from "./config";

const logger = new Logger('ROOT');

const client = new MunchkinClient({timeout: 2000});
client.connect(config.port, config.hostname);
