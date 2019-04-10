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

// making all arguments required for now

const argv = yargs 
    .options ({
        i: reqInput('nb_id', 'id for import'),
        

    })
    .help()
    .alias('help', 'h')
    .argv;
    
var getImportInfo = (nbID) => {
    // var url = 

    var headers = {
        'accept': 'application/json',
        'x-nextbus-jwt': fs.readFileSync(path.join(__dirname, '..', 'scripts', 'token.txt'))        
    };

    var options = () => {
        return {
        url: `https://ingest.nextbus.com/v2.0/dataset/${nbID}`,
        method: 'GET',
        headers,
        };
    };

    var intoStuff = options();
    var getTheStuff = (options) => {
        return request.get((options), (error, response, body) => {
            if (!error && response.statusCode === 200) {
                // console.log(JSON.parse(body));
                updateQueue = JSON.parse(body);

                // map the object to add meaningful keys
                var allMessages = updateQueue.import_events.map((messages) => {
                    return {
                        message: messages.message,
                        description: messages.import_event_type.description
                    };
                });

                // loop through allMessages to get object
                for (var i=0; i<allMessages.length; i++)

                    if (allMessages[i].description == "A fatal error has occurred and import cannot be completed.") {
                        console.log(allMessages[i].message)
                        console.log('\n\n#### Your Import did not Complete! ####')
                        return process.exit(0)
                    }
                    else if (allMessages[i].description == "Import is complete.") {
                        console.log(allMessages[i].description)
                        // return process.exit(0)
                    }
                    else if (allMessages[i].message == null) {
                        console.log(allMessages[i].description);
                    }
                    else if (allMessages[i].message != null) {
                        console.log(allMessages[i].message);
                    }
                    else
                        console.log('error');
            
            
            } else {
                console.log(`Hmmm.. can't seem to get your data.`, console.log(error));
            }
        });
    };


    // keep this funtion running - update 
    var timerForResponse = setInterval(() => {
        getTheStuff(intoStuff)
    }, 10000);



};

console.log('Running....Updating every 10 seconds until complete or error.')
getImportInfo(argv.i);

