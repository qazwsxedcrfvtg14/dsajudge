import winston from 'winston';
import wsconf from 'winston/lib/winston/config';
import moment from 'moment-timezone';

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            timestamp: function() {
                return moment().tz('Asia/Taipei').format('MM/DD hh:mm:ss');
            },
            formatter: function(options) {
                const {level, message, meta} = options;
                const levelStr = wsconf.colorize(options.level, '[' + options.level.toUpperCase() + ']');
                const messageStr = wsconf.colorize(options.level, message || '');
                const dateStr = options.timestamp();
                const metaStr = (meta && Object.keys(options.meta).length 
                    ? '\n\t' + JSON.stringify(options.meta, null, 2) : '');
                return `${levelStr} @${dateStr} - ${messageStr} ${metaStr}`;
            },
            colorize: true,
        })
    ],
});

export default logger;
