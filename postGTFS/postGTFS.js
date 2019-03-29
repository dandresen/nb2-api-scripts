const request = require('request');
const fs = require('fs');
const yargs = require('yargs');
var path = require('path');

var reqInput =  (alias, describe) => {
    return {
        demand: true,
        alias,
        describe,
        string: true
    };
};


const argv = yargs 
    .options ({
        a: reqInput('agency', 'NB2 agency (ex: cha)'),
        t: reqInput('time', 'Time to upload (ex: 2025-06-05T06:00:00z)'),
        z: reqInput('timezone', 'Timezone for agency (ex: America/New_York)'),
        s: reqInput('smoothing', 'Set between 0-18, set to 18 to keep original value'),
        d: reqInput('description', 'Add description for upload (ex: Schedule update for Spring'),
        f: reqInput('filename', 'Be sure to have the .zip file in the postGTFS dir\n(ex: cha_export.zip)'),
        e: reqInput('environments', 'all for all, ps for prod & stage\nsd for stage & dev\np for prod, s for stage, d for dev')

    })
    .help()
    .alias('help', 'h')
    .argv;


var importData = (agency, time, timezone, smoothing, description, filename, environment) => {     
    
    var agency = encodeURIComponent(agency);
    var time = encodeURIComponent(time);
    var timezone = encodeURIComponent(timezone);
    var smoothing = encodeURIComponent(smoothing); 
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
                console.log(`You are updating ${agency} and your id for ${envName} is`, JSON.parse(body));
            } else {
                console.log(`Hmmm.. can't seem to get post your data.`, console.log(error));
            }
        });
    };

    // which env is being updated?
    if (environment == 'd'){
        var url = envUrl.dev;
        var envName = envName.dev;
        var options = options(url);
        postTheData(options, envName);

    } else if (environment == 's'){
        var url = envUrl.stage;
        var envName = envName.stage;
        var options = options(url);
        postTheData(options, envName);

    } else if (environment == 'p'){
        var url = envUrl.prod;
        var envName = envName.prod;
        var options = options(url);
        postTheData(options, envName);

    } else if (environment == 'all'){
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

    } else if (environment == 'ps'){
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

    } else if (environment == 'sd'){
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

importData(argv.a, argv.t, argv.z, argv.s, argv.d, argv.f, argv.e)
