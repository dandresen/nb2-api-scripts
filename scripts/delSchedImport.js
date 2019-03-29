const request = require('request');
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


const argv = yargs 
    .options ({
        i: reqInput('importId', 'id for import'),
        e: reqInput('environment', 'p for prod, s for stage, d for dev')
        

    })
    .help()
    .alias('help', 'h')
    .argv;

var deleteSchedImport = (importID, environment) => {   
        
    var importID = encodeURIComponent(importID);

    
    var headers = {
        'accept': 'application/json',
        'x-nextbus-jwt': fs.readFileSync('token.txt', 'utf8')
    };

    var envUrl = {
        dev: `https://dev.ingest.nxbs2dev.com/v2.0/dataset/${importID}`,
        stage: `https://staging.ingest.nxbs2dev.com/v2.0/dataset/${importID}`,
        prod: `https://ingest.nextbus.com/v2.0/dataset/${importID}`
    };

    var envName = {
        dev: 'Dev',
        stage: 'Stage',
        prod: 'Prod'
    };

    var options = (url) => {
        return {
        url,
        method: 'DELETE',
        headers,
        };
    };

    // main function deletes scheduled import
    var deleteTheData = (options, envName) => {
        return request.delete((options), (error, response, body) => {
            if (!error && response.statusCode === 200) {
                console.log(`From ${envName}: `, JSON.parse(body));
            } else {
                console.log(`Hmmm.. can't seem to delete your data.`, console.log(error));
            }
        });
    };

    // which env is being used?
    if (environment == 'd'){
        var url = envUrl.dev;
        var envName = envName.dev;
        var options = options(url);
        deleteTheData(options, envName);

    } else if (environment == 's'){
        var url = envUrl.stage;
        var envName = envName.stage;
        var options = options(url);
        deleteTheData(options, envName);

    } else if (environment == 'p'){
        var url = envUrl.prod;
        var envName = envName.prod;
        var options = options(url);
        deleteTheData(options, envName);
    
    } else {
        console.log(`Wrong environment, you put: \n${environment}`)
    }   

};

// module.exports.deleteSchedImport = deleteSchedImport
deleteSchedImport(argv.i, argv.e);
