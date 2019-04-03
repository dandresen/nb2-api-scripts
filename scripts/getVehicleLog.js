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

var notReqInput = (alias, describe) => {
    return {
        demand: false,
        alias,
        describe,
        string: true
    };
};

const argv = yargs 
    .options ({
        a: reqInput('agency', 'NB2 agency (ex: cha)'),
        v: reqInput('vehicleId', 'route id given by authority'),
        s: reqInput('startDate', '"2019-03-04 13:00"- include quotes'),
        f: reqInput('endDate', '"2019-03-04 14:00"- include quotes'),
        q: notReqInput('search', 'can seach for block, trip, predictability etc.'),
        e: reqInput('environment', 'p for prod, s for stage, d for dev')
        

    })
    .help()
    .alias('help', 'h')
    .argv;

var getVehLog = (agency, vehicle, start, end, search, environment) => {     
    
    var agency = encodeURIComponent(agency);
    var vehicle = encodeURIComponent(vehicle);
    var startUnix = encodeURIComponent(moment(start).unix());
    var endUnix = encodeURIComponent(moment(end).unix()); 
    var search = encodeURIComponent(search);
 

    var headers = {
        'accept': 'application/json',
        'x-nextbus-jwt': fs.readFileSync('token.txt', 'utf8')

    };
    var logUrl = {
        dev: `https://dev.api.nxbs2dev.com/v2.0/${agency}/vehicles/${vehicle}/log?search=${search}&startTimestamp=${startUnix}&endTimestamp=${endUnix}`,
        stage: `https://staging.api.nxbs2dev.com/v2.0/${agency}/vehicles/${vehicle}/log?search=${search}&startTimestamp=${startUnix}&endTimestamp=${endUnix}`,       
        prod: `https://api.nextbus.com/v2.0/${agency}/vehicles/${vehicle}/log?search=${search}&startTimestamp=${startUnix}&endTimestamp=${endUnix}`
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
    var getRouteLog = (options, vehicle, envName) => {
        return request.get((options), (error, response, body) => {
            if (!error && response.statusCode === 200) {
                console.log(`Here is your result for vehicle ${vehicle} in ${envName}: `)
                var origLog = JSON.parse(body);
                
                // the 'note' value in the JSON has useful info, it's just stored in a string... why??
                var accessPredictability = (note) => {
                    return  note.substring (
                        note.indexOf("y:") + 3,
                        note.lastIndexOf("odometer") -1
                    );     
                };

                // some times are null- mark these

                // var readableTime = (time) => {
                //     if (time == null ) {
                //         return "MISSING-TIME";
                //     }
                //         return moment.unix(time).format("HH:mm:ss");            
                // };

                var readableTimestamp = (time) => {
                    if (time == null ) {
                        return "MISSING-TIME";
                    }
                        return moment(time).format("YYYY-MM-DD HH:mm:ss");

                        
                };
            
                // log object
                var finalLogObj = origLog.map((log) => {
                    return {
                        authority: log.authority_id ,
                        vehicle_id: log.vehicle_id ,
                        trip_id: log.trip_id ,
                        trip_iteration: log.trip_iteration,
                        block_id: log.block_id,
                        route_id: log.route_id ,
                        predictabiity: accessPredictability(log.note),
                        report_date: readableTimestamp(log.report_date)
                    };
                });

                var csvStartTime = moment(start).format('MM-DD-HH:mm')
                var csvEndTime = moment(end).format('HH:mm');

                // Export to CSV
                jsonexport(finalLogObj, (err,csv) => {
                    if(err) {
                        return console.log(err);
                    }    
                        // console.log(csv);
                        fs.writeFile(`./output/VehLog-${agency}-Veh${vehicle}-${csvStartTime}to${csvEndTime}.csv`, csv, function(err) {
                            if(err) {
                                return console.log(err);
                            }

                            console.log(`Created output/VehLog-${agency}-Veh${vehicle}-${csvStartTime}to${csvEndTime}.csv`);
                        });
                });

            } else {
                console.log(`Hmmm.. can't seem to get your data.`, console.log(error));
            }
        });
    };


    // which env are you trying to reach?
    if (environment == 'd'){
        var url = logUrl.dev;
        var envName = envName.dev;
        var options = options(url);
        getRouteLog(options, vehicle, envName);
    } else if (environment == 's') {
        var url = logUrl.stage;
        var envName = envName.stage;
        var options = options(url);
        getRouteLog(options, vehicle, envName);
    } else if (environment == 'p'){
        var url = logUrl.prod;
        var envName = envName.prod;
        var options = options(url);
        getRouteLog(options, vehicle, envName);
    
    } else {
        console.log(`Wrong environment, you put: \n${environment}`)
    }   

};


getVehLog(argv.a, argv.v, argv.s, argv.f, argv.q, argv.e);