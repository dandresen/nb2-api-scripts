const request = require('request');
const jsonexport = require('jsonexport');
const moment = require('moment');
const fs = require('fs');
const yargs = require('yargs');
const tz = require('moment-timezone');

var {
    getCurrInfo
} = require('../postGTFS/getCurrInfo'); // module to get timezone and convert time for agency


var reqInput = (alias, describe) => {
    return {
        demand: true,
        alias,
        describe,
        string: true
    };
};


// making all arguments required for now
const argv = yargs
    .options({
        a: reqInput('agency', 'NB2 agency (ex: cha)'),
        r: reqInput('routeId', 'route id given by authority'),
        s: reqInput('startDate', '"2019-03-04 13:00"- include quotes'),
        f: reqInput('endDate', '"2019-03-04 14:00"- include quotes'),
        m: reqInput('max', 'max number results for query'),
        e: reqInput('environment', 'p for prod, s for stage, d for dev')


    })
    .help()
    .alias('help', 'h')
    .argv;


function main() {
    var initalize = getCurrInfo(argv.a);
    // the getCurrInfo function uses a promise to get the agency timezone 
    initalize.then((data) => {

        var tmz = data;
        // handle the -t NOT being passed in (i.e. update now)

        // converts the timezone here using 'tmz' (timezone) and the -t argument
        // var propertmz = moment.tz(`${argv.t}`, `${tmz}`);
        // var goodtime = propertmz.format();
        


        var routePredArchive = (agency, route, start, end, max, environment) => {

            var agency = encodeURIComponent(agency);
            var route = encodeURIComponent(route);
            var startUnix = encodeURIComponent(moment(start).unix());
            var endUnix = encodeURIComponent(moment(end).unix());
            var max = encodeURIComponent(max);

            var headers = {
                'accept': 'application/json',
                'x-nextbus-jwt': fs.readFileSync('token.txt', 'utf8')
            };

            var archiveUrl = {
                dev: `https://dev.api.nxbs2dev.com/v2.0/${agency}/${agency}/routes/${route}/predictions/archive?beginDate=${startUnix}&endDate=${endUnix}&max=${max}`,
                stage: `https://staging.api.nxbs2dev.com/v2.0/${agency}/${agency}/routes/${route}/predictions/archive?beginDate=${startUnix}&endDate=${endUnix}&max=${max}`,
                prod: `https://api.nextbus.com/v2.0/${agency}/${agency}/routes/${route}/predictions/archive?beginDate=${startUnix}&endDate=${endUnix}&max=${max}`
            };

            var envName = {
                dev: 'Dev',
                stage: 'Stage',
                prod: 'Prod'
            };

            var options = (url) => {
                return {
                    url,
                    method: 'GET',
                    headers,
                };
            };

            // main function that gets the data
            var getRoutePred = (options, route, envName) => {
                return request.get((options), (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        console.log(`Here is your result for route ${route} in ${envName}: `)
                        var origArchive = JSON.parse(body);

                        // some times are null- mark these
                        var readableTime = (time) => {
                            if (time == null) {
                                return "MISSING-TIME";
                            }
                            // don't need the date here, the date is in the Timestamp field
                            return moment.unix(time).format("HH:mm:ss");


                        };
                        var readableTimestamp = (time) => {
                            if (time == null) {
                                return "MISSING-TIME";
                            }
                            var propertmz = moment.unix(time).format(); // tryin gto get this to work 
                            var righttmz = moment.tz(propertmz,tmz);
                            return console.log(righttmz.format());
                            return console.log(propertmz.moment.tz(time, tmz));
                            return moment.unix(propertmz).format("YYYY-MM-DD HH:mm:ss");


                        };

                        // strip out the bs in the keys 
                        var readableKeys = (keyIn) => {
                            if (keyIn == null) {
                                return "MISSING-KEY"
                            }
                            return keyIn.substring(
                                keyIn.indexOf("|") + 1,
                                keyIn.lastIndexOf("|")
                            );
                        };

                        // Archive JSON
                        var finalArchiveObj = origArchive.results.map((archive) => {
                            return {
                                timestamp: readableTimestamp(archive.timestamp),
                                stop: readableKeys(archive.stop_key),
                                route: readableKeys(archive.route_key),
                                vehicle: readableKeys(archive.vehicle_key),
                                trip_id: archive.trip_id,
                                distance_to_stop: archive.distance_to_stop,
                                predicted_departure: readableTime(archive.predicted_departure),
                                actual_departure: readableTime(archive.actual_departure),
                                predicted_arrival: readableTime(archive.predicted_arrival),
                                actual_arrival: readableTime(archive.actual_arrival),

                            };
                        });

                        var csvStartTime = moment(start).format('MM-DD-HH:mm')
                        var csvEndTime = moment(end).format('HH:mm');

                        // Export to CSV
                        jsonexport(finalArchiveObj, (err, csv) => {
                            if (err) {
                                return console.log(err);
                            }
                            // console.log(csv);
                            fs.writeFile(`./output/RteArchive-${agency}-Rte${route}-${csvStartTime}to${csvEndTime}.csv`, csv, function (err) {
                                if (err) {
                                    return console.log(err);
                                }

                                console.log(`Created output/RteArchive-${agency}-Rte${route}-${csvStartTime}to${csvEndTime}.csv`);
                            });
                        });

                    } else {
                        console.log(`Hmmm.. can't seem to get your data.`, console.log(error));
                    }
                });
            };

            // which env you trying to reach?
            if (environment == 'd') {
                var url = archiveUrl.dev;
                var envName = envName.dev;
                var options = options(url);
                getRoutePred(options, route, envName);

            } else if (environment == 's') {
                var url = archiveUrl.stage;
                var envName = envName.stage;
                var options = options(url);
                getRoutePred(options, route, envName);

            } else if (environment == 'p') {
                var url = archiveUrl.prod;
                var envName = envName.prod;
                var options = options(url);
                getRoutePred(options, route, envName);

            } else {
                console.log(`Wrong environment, you put: \n${environment}`)
            }

        };

        routePredArchive(argv.a, argv.r, argv.s, argv.f, argv.m, argv.e);

    });
}

main();