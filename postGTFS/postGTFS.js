const request = require('request');
const fs = require('fs');
const yargs = require('yargs');
const path = require('path');
const moment = require('moment');
const tz = require('moment-timezone');

var {getImportUpdate} = require('./getImportInfo') // module to tail the import and console log import update info
var {getCurrInfo} = require('./getCurrInfo'); // module to get timezone and convert time for agency


var reqInput = (alias, describe) => {
    return {
        demand: true,
        alias,
        describe,
        string: true
    };
};

var notReqInput = (alias, describe) => {
    return {
        demand: false,
        alias,
        describe,
        string: true
    };
};

const argv = yargs
    .options({
        a: reqInput('agency', 'Agency ID (ex: vmc)'),
        t: notReqInput('time', `Leave blank to update now. Otherwise, enter the date and time you'd like to schedule the import.`
            + ' The script will adjust the time based on the agency timezone.'
            +  ' Use the 24hr clock AND double quotes: \nformat example: "2019-05-06 02:00" (2am) OR "2019-05-06 14:00" (2pm)'),
        s: notReqInput('smoothing', 'Leave blank to keep original value of 18, otherwise set between 0-18.'),
        d: reqInput('description', 'Add description for upload- \nuse double quotes (ex: "Schedule update for Spring")'),
        f: reqInput('filename', 'Be sure to have the .zip file in the postGTFS dir\n(ex: vmc_export.zip)'),
        e: reqInput('environments', 'all for all, ps for prod & stage\nsd for stage & dev\np for prod, s for stage, d for dev')

    })
    .help()
    .alias('help', 'h')
    .argv;

// running this as a 'main' function to get async stuff to work 
function main() {
    var initalize = getCurrInfo(argv.a, argv.t);
    // the getCurrInfo function uses a promise to get the agency timezone 
    initalize.then((data) => {
        console.log(`Now lets update ${argv.a}'s data!\n`);

        var tmz = data;
        // handle the -t NOT being passed in (i.e. update now)
        if (argv.t === undefined) { 
            var now = moment();
            // take today's timestamp and subtract todays
            var goodtime = now.subtract(2, "days").format(`YYYY-MM-DDTHH:mm:ssZ`);
        } else {
        // converts the timezone here using 'tmz' (timezone) and the -t argument
        var propertmz = moment.tz(`${argv.t}`, `${tmz}`);
        var goodtime = propertmz.format();
        };

        var importData = (smoothingInput, description, filename, environment) => {

            // set smoothing to 18 if not specified 
            if (smoothingInput === undefined) {
                var smoothurl = 18
            } else {
                var smoothurl = smoothingInput 
            }
            
            var agency = encodeURIComponent(argv.a);
            var time = encodeURIComponent(goodtime);
            var timezone = encodeURIComponent(tmz);
            var smoothing = encodeURIComponent(smoothurl);
            var description = encodeURIComponent(description);

            var headers = {
                'accept': 'application/json',
                'x-nextbus-jwt': fs.readFileSync(path.join(__dirname, '..', 'scripts', 'token.txt')),
                'Content-Type': 'multipart/form-data'
            };

            // reads GTFS file from postGTFS directory 
            var formData = {
                datasetFile: {
                    value: fs.createReadStream(path.join(__dirname, `${filename}`)),
                    options: {
                        filename: `${filename}`,
                        type: 'application/zip'
                    }
                }
            };

            var envUrl = {
                dev: `https://dev.ingest.nxbs2dev.com/v2.0/${agency}/dataset?scheduled_import_time=${time}&distance_units=meters&timezone=${timezone}&smoothing=${smoothing}&description=${description}`,
                stage: `https://staging.ingest.nxbs2dev.com/v2.0/${agency}/dataset?scheduled_import_time=${time}&distance_units=meters&timezone=${timezone}&smoothing=${smoothing}&description=${description}`,
                prod: `https://ingest.nextbus.com/v2.0/${agency}/dataset?scheduled_import_time=${time}&distance_units=meters&timezone=${timezone}&smoothing=${smoothing}&description=${description}`
            };

            var envName = {
                dev: 'Dev',
                stage: 'Stage',
                prod: 'Prod'
            };

            var options = (url) => {
                return {
                    url,
                    method: 'POST',
                    headers,
                    formData
                };
            };

            // main function that post to data
            var postTheData = (options, envName) => {
                return request.post((options), (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        importAll = JSON.parse(body);
                        importId = importAll.import_id
                        console.log(`You are updating ${agency} for ${envName} and your id is ${importId}- THIS UPDATE HAS BEEN SENT TO NB2 ${envName}`);
                        console.log('\nNow...Updating with current status for the import every 10 seconds until COMPLETE, SCHEDULED or ERROR.')
                        return getImportUpdate(importId, environment);

                    } else {
                        console.log(`Hmmm.. can't seem to get post your data.`, console.log(error));
                    }
                });
            };

            // which env is being updated?
            if (environment == 'd') {
                var url = envUrl.dev;
                var envName = envName.dev;
                var options = options(url);
                postTheData(options, envName);

            } else if (environment == 's') {
                var url = envUrl.stage;
                var envName = envName.stage;
                var options = options(url);
                postTheData(options, envName);

            } else if (environment == 'p') {
                var url = envUrl.prod;
                var envName = envName.prod;
                var options = options(url);
                postTheData(options, envName);

            } else if (environment == 'all') {
                // stage
                var urlS = envUrl.stage;
                var envNameS = envName.stage;
                var optionsS = options(urlS);
                postTheData(optionsS, envNameS);
                // dev
                var urlD = envUrl.dev;
                var envNameD = envName.dev;
                var optionsD = options(urlD);
                postTheData(optionsD, envNameD);
                // prod
                var urlP = envUrl.prod;
                var envNameP = envName.prod;
                var optionsP = options(urlP);
                postTheData(optionsP, envNameP);

            } else if (environment == 'ps') {
                // stage
                var urlS = envUrl.stage;
                var envNameS = envName.stage;
                var optionsS = options(urlS);
                postTheData(optionsS, envNameS);
                // prod
                var urlP = envUrl.prod;
                var envNameP = envName.prod;
                var optionsP = options(urlP);
                postTheData(optionsP, envNameP);

            } else if (environment == 'sd') {
                // stage
                var urlS = envUrl.stage;
                var envNameS = envName.stage;
                var optionsS = options(urlS);
                postTheData(optionsS, envNameS);
                // dev
                var urlD = envUrl.dev;
                var envNameD = envName.dev;
                var optionsD = options(urlD);
                postTheData(optionsD, envNameD);

            } else {
                console.log(`Wrong environment, you put: \n${environment}`)
            }

        };

        importData(argv.s, argv.d, argv.f, argv.e)

    }, (err) => {
        console.log(err);
    });
};
main();