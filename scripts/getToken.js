// Run this from the scripts directory
// If all of your passwords and usernames for nextbus2 are the same, then you are good-to-go.
// If not, you can change the url to whatever enviroment you'd like (line 37). 

const request = require('request');
const yargs = require('yargs');
const fs = require('fs');


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
        u: reqInput('username','Username for nextbus2'),
        p: reqInput('password','Password for nextbus2')
    
    })
    .help()
    .alias('help', 'h')
    .argv;

var getToken = (username, password) => {
    
    var headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    var body = `{ "ident": "${username}", "password": "${password}"}`;
    
    // CHANGE URL HERE // 
    var options = {
        url: 'https://staging.api.nxbs2dev.com/v2.0/login',
        // url: 'https://dev.api.nxbs2dev.com/v2.0/login',
        // url: 'https://api.nextbus.com/v2.0/login',
        method: 'POST',
        headers,
        body
    };
    request ((options), (error, response, body) => {
        if (!error && response.statusCode === 200) {
            allBody = (JSON.parse(body));

            fs.writeFile('./token.txt', allBody.token, function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log(`Awesome-sauce! Put your token in scripts/token.txt`);
            });
            
        } else {
            console.log(`Hmmm.. can't seem to get your token.\n\nCheck your username and password.`, console.log(response.body));
        }
    });
};

getToken(argv.u, argv.p);
