const request = require('request');
const jsonexport = require('jsonexport');
const moment = require('moment');
const fs = require('fs');
const yargs = require('yargs');

var reqInput =  (alias, describe) => {
    return {
        demand: true,
        alias,
        describe,
        string: true
    };
};

// making all arguments required for now

const argv = yargs 
    .options ({
        a: reqInput('agency', 'NB2 agency (ex: cha)'),
        i: reqInput('stopId', 'stop id given by authority (ex: heig_a)'),
        s: reqInput('startDate', '"2019-03-04 13:00"- include quotes'),
        f: reqInput('endDate', '"2019-03-04 14:00"- include quotes'),
        m: reqInput('max', 'max number results for query'),
        e: reqInput('environment', 'p for prod, s for stage, d for dev')
        

    })
    .help()
    .alias('help', 'h')
    .argv;


var vehStopArchive = (agency, stopid, start, end, max, environment) => {     
    
    var agency = encodeURIComponent(agency);
    var stopid = encodeURIComponent(stopid);
    var startUnix = encodeURIComponent(moment(start).unix());
    var endUnix = encodeURIComponent(moment(end).unix()); 
    var max = encodeURIComponent(max);

    var headers = {
        'accept': 'application/json',
        'x-nextbus-jwt': fs.readFileSync('token.txt', 'utf8')

    };

    var archiveUrl = {
        dev: `https://dev.api.nxbs2dev.com/v2.0/${agency}/${agency}/stops/${stopid}/predictions/archive?beginDate=${startUnix}&endDate=${endUnix}&max=${max}`,        
        stage: `https://staging.api.nxbs2dev.com/v2.0/${agency}/${agency}/stops/${stopid}/predictions/archive?beginDate=${startUnix}&endDate=${endUnix}&max=${max}`,        
        prod: `https://api.nextbus.com/v2.0/${agency}/${agency}/stops/${stopid}/predictions/archive?beginDate=${startUnix}&endDate=${endUnix}&max=${max}`,
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
    var getStopPred = (options, stopid, envName) => {
        return request.get((options), (error, response, body) => {
            if (!error && response.statusCode === 200) {
                console.log(`Here is your result for stop ${stopid} in ${envName}: `)
                var origArchive = JSON.parse(body);

                // some times are null- mark these

                // Time only
                var readableTime = (time) => {
                    if (time == null ) {
                        return "MISSING-TIME";
                    }
                        return moment.unix(time).format("HH:mm:ss");

                        
                };

                // Date and time for timestamp
                var readableTimestamp = (time) => {
                    if (time == null ) {
                        return "MISSING-TIME";
                    }
                        return moment.unix(time).format("YYYY-MM-DD HH:mm:ss");

                        
                };

                // Strip out the bs in the keys 
                var readableKeys = (keyIn) => {
                    if (keyIn == null) {
                        return "MISSING-KEY"
                    }
                        return  keyIn.substring(
                                    keyIn.indexOf("|") + 1,
                                    keyIn.lastIndexOf("|")
                                );          
                };
            
                // archive JSON
                var finalArchiveObj = origArchive.results.map((archive) => {
                    return {
                        timestamp: readableTimestamp(archive.timestamp),
                        stop: readableKeys(archive.stop_key),
                        route: readableKeys(archive.route_key),
                        vehicle: readableKeys(archive.vehicle_key),
                        trip_id: archive.trip_id,
                        trip_headsign: archive.trip_headsign,  
                        distance_to_stop: archive.distance_to_stop,
                        predicted_departure: readableTime(archive.predicted_departure),
                        actual_departure: readableTime(archive.actual_departure),
                        predicted_arrival: readableTime(archive.predicted_arrival),
                        actual_arrival: readableTime(archive.actual_arrival),
        
                    };
                });

                // Export to CSV
                jsonexport(finalArchiveObj, (err,csv) => {
                    if(err) {
                        return console.log(err);
                    }    
                        // console.log(csv);

                        fs.writeFile(`./output/StopArchive-${agency}-Stop${stopid}-${start}.csv`, csv, function(err) {
                            if(err) {
                                return console.log(err);
                            }
        
                            console.log(`Created output/StopArchive-${agency}-Stop${stopid}-${start}.csv`);
                        });
                });

            } else {
                console.log(`Hmmm.. can't seem to get your data.`, console.log(error));
            }
        });
    };


    // which env is being used?
    if (environment == 'd'){
        var url = archiveUrl.dev;
        var envName = envName.dev;
        var options = options(url);
        getStopPred(options, stopid, envName);

    } else if (environment == 's'){
        var url = archiveUrl.stage;
        var envName = envName.stage;
        var options = options(url);
        getStopPred(options, stopid, envName);

    } else if (environment == 'p'){
        var url = archiveUrl.prod;
        var envName = envName.prod;
        var options = options(url);
        getStopPred(options, stopid, envName);
    
    } else {
        console.log(`Wrong environment, you put: \n${environment}`)
    }   

};

vehStopArchive(argv.a, argv.i, argv.s, argv.f, argv.m, argv.e);
