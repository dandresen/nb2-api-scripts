const request = require('request');
const fs = require('fs');
const path = require('path');
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
        a: reqInput('agency', 'NB2 agency (ex: cha)'),

    })
    .help()
    .alias('help', 'h')
    .argv;
    
var getCurrInfo = (agency) => {
    var envUrl = {
        prod: `https://ingest.nextbus.com/v2.0/dataset?search=${agency}&statusFilter=current`,
        stage: `https://staging.ingest.nxbs2dev.com/v2.0/dataset?search=${agency}&statusFilter=current`,
        dev: `https://dev.ingest.nxbs2dev.com/v2.0/dataset?search=${agency}&statusFilter=current`

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

    // call prod
    url = envUrl.prod;
    var optionsp = options(url)
    // call stage
    urls = envUrl.stage;
    var optionss = options(urls)
    // call dev
    urld = envUrl.dev;
    var optionsd = options(urld)

    // main function to pick off timezone
    // walks through each enviroment looking for timezone
    var getCurrDataInfo = () => {
        // look on prod
        return request.get((optionsp), (error, response, body) => {
            if (!error && response.statusCode === 200) {
                
                data = JSON.parse(body); 
                if (Object.keys(data).length != 0) {
                    console.log('Success Prod:', data[0].timezone);
                
                } else {
                    // look on stage
                    return request.get((optionss), (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            
                            data = JSON.parse(body);
                            if (Object.keys(data).length != 0) {
                                console.log('Success Stage:', data[0].timezone);

                            } else {
                                // look on dev
                                return request.get((optionsd), (error, response, body) => {
                                    if (!error && response.statusCode === 200) {
    
                                        data = JSON.parse(body);
                                        if (Object.keys(data).length != 0) {
                                            console.log('Success Dev:', data[0].timezone);
            
                                        }
                                        console.log('No Timezone Exist!! Is this the first GTFS import?');
                                        console.log(`\nPlease add the timezone manually to the script using\n -z America/Chicago /Denver /Los_Angeles /New_York (or the needed TZ).`);
    
                                     };
                                        
                                });
                            };
                        };
                    });
                };

        
            } else {
                console.log(`Looks like there is an error in the request...`, response.statusCode)
                return process.exit(0);
            }
        });
    };


    getCurrDataInfo();

    // logic to take the timezone and convert it to zulu 

};

// exports.getCurrInfo = getCurrInfo;
getCurrInfo(argv.a);




