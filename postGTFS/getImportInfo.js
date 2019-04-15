const request = require('request');
const fs = require('fs');
var path = require('path');

// pass in the update id and the environment (prod, stage, dev) to see the update status
// this function can only tail ONE update at a time
// it calls the GET request every 10 seconds until certain criteria is met    
var getImportUpdate = (nbID, environment) => {
    var envUrl = {
        prod: `https://ingest.nextbus.com/v2.0/dataset/${nbID}`,
        stage: `https://staging.ingest.nxbs2dev.com/v2.0/dataset/${nbID}`,
        dev: `https://dev.ingest.nxbs2dev.com/v2.0/dataset/${nbID}`

    };

    var envName = {
        dev: 'Dev',
        stage: 'Stage',
        prod: 'Prod'
    };

    var headers = {
        'accept': 'application/json',
        'x-nextbus-jwt': fs.readFileSync(path.join(__dirname, '..', 'scripts', 'token.txt'))        
    };

    var options = (url) => {
        return {
        url,
        method: 'GET',
        headers,
        };
    };

    // var intoStuff = options();
    var getTheUpdateInfo = (options, environment) => {
        return request.get((options), (error, response, body) => {
            if (!error && response.statusCode === 200) {
                
                updateQueue = JSON.parse(body);

                // map the object to add meaningful keys
                var allMessages = updateQueue.import_events.map((messages) => {
                    return {
                        message: messages.message,
                        description: messages.import_event_type.description
                    };
                })

                // loop through allMessages to get object
                for (var i=0; i<allMessages.length; i++)
                    // Import fails
                    if (allMessages[i].description == "A fatal error has occurred and import cannot be completed.") {
                        console.log(allMessages[i].message)
                        console.log(`\n\n#### Your Import did not Complete for ${environment}! ####\n\n`)
                        return process.exit(0)
                    }
                    // Import is complete
                    else if (allMessages[i].description == 'Import is complete.') {
                        console.log(`\n\nCONGRATULATIONS! Your update has completed for ${environment}\n\n`);
                        return process.exit(0);
                    }
                    // Scheudled import
                    else if (allMessages[i].description == 'Import is schedule to occur at a specified time in the future.') {
                        console.log(allMessages[i].message, `for ${environment}`);
                        return process.exit(0);
                    }
                    // Sometimes message is null, so print description                    
                    else if (allMessages[i].message == null) {
                        console.log(allMessages[i].description);
                    }

                    else if (allMessages[i].message != null) {
                        console.log(allMessages[i].message);
                    }
                    else
                        console.log(`error- something went wrong in ${envName}`);
                        
            
            
            } else {
                console.log(`\nHmmm.. can't seem to track the progress of your import. At this time we can only track one import at a time.`);
                console.log('\nYou can log into the NB2 Agency Portal page to see the status of your update.')
                return process.exit(0)
            }
        });
    };

    // which env is being updated?
    if (environment == 'd'){
        var url = envUrl.dev;
        var envName = envName.dev;
        var options = options(url);

    } else if (environment == 's'){
        var url = envUrl.stage;
        var envName = envName.stage;
        var options = options(url);

    } else if (environment == 'p'){
        var url = envUrl.prod;
        var envName = envName.prod;
        var options = options(url);
    } else {
        console.log('CAN ONLY TRACK ONE UPDATE AT A TIME!');
    }   

    // keep this function running - update every 10 seconds
    var timerForResponse = setInterval (() => {
        getTheUpdateInfo(options, envName)
    }, 10000);


};

exports.getImportUpdate = getImportUpdate;

