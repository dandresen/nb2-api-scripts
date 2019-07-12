const request = require('request');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Determine an agency's timezone based on previous update.

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



    // Search through each environment to pick-off the timezone

    // call to dev
    return new Promise((resolve, reject) => {
        var getCurrInfoDev = () => {

            return request.get((optionsd), (error, response, body) => {
                if (!error && response.statusCode === 200) {

                    data = JSON.parse(body);
                    if (Object.keys(data).length != 0) {
                        console.log('Ahhhh, I see you have a Dev agency...\n');
                        resolve(data[0].timezone);
                    } else {
                        console.log(`Can't find your timezone.`);
                    }
                } else {
                    reject(error);
                    console.log(`Error in request`, error);
                }
            });
        };
        // call to stage
        var getCurrInfoStage = () => {
            return request.get((optionss), (error, response, body) => {
                if (!error && response.statusCode === 200) {

                    data = JSON.parse(body);
                    if (Object.keys(data).length != 0) {
                        resolve(data[0].timezone);
                    } else {
                        console.log('Not in Stage!... Checking Dev...');
                        getCurrInfoDev();
                    }
                } else {
                    reject(error);
                    console.log(`Error in request`, error);
                }
            });
        };

        var getCurrInfoProd = () => {
            return request.get((optionsp), (error, response, body) => {
                if (!error && response.statusCode === 200) {

                    data = JSON.parse(body);
                    console.log('Finding the agency and converting the date and time to the proper timezone...');
                    if (Object.keys(data).length != 0) {
                        resolve(data[0].timezone);
                    } else {
                        console.log('Agency not in Prod!... Checking Stage...');
                        getCurrInfoStage();
                    }
                } else {
                    reject(error);
                    console.log(`Error in request`, error);
                }
            });
        };
        
        getCurrInfoProd();
    });

}

module.exports = {
    getCurrInfo
};
