const request = require('request');
const fs = require('fs');
const path = require('path');
// const yargs = require('yargs');
const moment = require('moment');

    
var getCurrInfo = (agency, time) => {
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
    var getCurrInfoDev = () => {
        rp((optionsd), (error, response, body) => {
            if (!error && response.statusCode === 200) {
                
                data = JSON.parse(body); 
                if (Object.keys(data).length != 0) {
                    var tmz = data[0].timezone;
                    var propertmz = moment.tz(`${time}`, `${tmz}`);
                    console.log(propertmz.format(), `${tmz}`);
                } else {
                    console.log(`Can't find your timezone.`)
                }            
            } else {
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
                    var tmz = data[0].timezone;
                    var propertmz = moment.tz(`${time}`, `${tmz}`);
                    console.log(propertmz.format(), `${tmz}`);
                    // console.log(`Success Stage: ${tmz}`);
                } else {
                    console.log('Not in Stage!... Checking Dev...')
                    getCurrInfoDev();
                }            
            } else {
                console.log(`Error in request`, error);
            }
        });
    };

    var getCurrInfoProd = () => {
        return request.get((optionsp), (error, response, body) => {
           if (!error && response.statusCode === 200) {
               
               data = JSON.parse(body); 
               if (Object.keys(data).length != 0) {
                   var tmz = data[0].timezone;
                   var propertmz = moment.tz(`${time}`, `${tmz}`);
                   console.log(propertmz.format(), `${tmz}`);
                   // console.log(`Success Stage: ${tmz}`);
               } else {
                   console.log('Agency not in Prod!... Checking Stage...')
                   getCurrInfoStage();
               }            
           } else {
               console.log(`Error in request`, error);
           }
       });
   };

    // Call prod first, if nothing is found, it will call funtions to 
    // look through the other environments.
    getCurrInfoProd();


};

module.exports = {getCurrInfo};



// console.log(getCurrInfo())

// var main = () => {
//     getCurrDataInfo().then(function(results) {
//         var chicago = moment.tz("2019-04-18 01:00", `${results}` );
//         console.log(chicago.format());
//     });
// }

// main()



