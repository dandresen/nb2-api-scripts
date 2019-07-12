# nb2-api-scripts
Command line scripts to interact with the NB2 API to make life easier. Keep in mind this a work in progress, as I build out and test these scripts, I will upate this README. 

#### These scripts assume that you have access to the NB2 environments. It also assumes that your username and password are the same between all of the environments. If you have different username and passwords, please either make them all the same or, go to the FAQ section of this README.

## Table of Contents

- [Installation](#installation)
    - [Clone/Download](#clone)
- [Examples:](#examples) 
    - [GET API Token](#get-api-token)
    - [POST GTFS](#post-gtfs) 
    - [DELETE Scheduled Import](#delete-scheduled-import)
    - [GET Route Predictions Archive](#get-route-predictions-archive)
    - [GET Vehicle Predictions Archive](#get-vehicle-predictions-archive)
- [FAQ](#faq)



---

## Installation

To run these scripts, you will need Node.js installed on your environement.

### Node

[Node](http://nodejs.org/) is really easy to install. 

You should be able to run the following command after the installation procedure
below. (Your versions will be different)

    $ node --version
    v8.10.0 

    $ npm --version
    3.5.2

#### Node installation on Linux

    sudo apt update
    sudo apt install nodejs npm

#### Node installation on Windows

Just go on [official Node.js website](http://nodejs.org/) & grab the installer for the most recent version.
Also, be sure to have `git` available in your PATH, `npm` will need it.


The packages used in these scripts are:

```script
  "dependencies": {
    "jsonexport": "^2.4.1",
    "moment": "^2.24.0",
    "moment-timezone": "^0.5.25",
    "request": "^2.88.0",
    "yargs": "^13.2.2"
  },
 
```
 Run `$ npm install` to install all of the packages. 

### Clone

Clone or download this repo to your local machine.

---

## Examples

In a terminal, navigate to your ```nb2-api-scripts/``` directory. There, you will see a ```postGTFS/``` directory and a 
```scripts/``` directory.

Run the GTFS import script, ```postGTFS.js``` from the ```postGTFS/``` directory. Run all of the other scripts from the ```scripts/ ``` directory.

---
#### GET-API-Token
##### DO THIS FIRST!

```script

Options:

  -u, --username  Username for NB2                      [string] [required]
  -p, --password  Password for NB2                      [string] [required]
  
  $ cd scripts/
  $ node getToken.js -u [username] -p [password]

```

This script saves your API token to ```scripts/token.txt```. 

---
#### POST-GTFS 

Place your GTFS ```.zip``` file in ```postGTFS/``` then run the following script to update all, some, or one of the NB2 enviroments with a new GTFS schedule.
I've scripted the update status to console log to the session so folks can track the status of the update.
NOTE that you can only tail one import at a time. You can still update all environments at the the same time, but you will be prompted to log into the AP to view the results. 

```script
Options:
  --version           Show version number                              [boolean]
  -a, --agency        Agency ID (ex: vmc)                    [string] [required]
  -t, --time          Leave blank to update now. Otherwise, enter the date and
                      time you'd like to schedule the import. The script will
                      adjust the time based on the agency timezone. Use the 24hr
                      clock AND double quotes:
                      format example: "2019-05-06 02:00" (2am) OR "2019-05-06
                      14:00" (2pm)                                      [string]
  -s, --smoothing     Leave blank to keep original value of 18, otherwise set
                      between 0-18.                                     [string]
  -d, --description   Add description for upload-
                      use double quotes (ex: "Schedule update for Spring")
                                                             [string] [required]
  -f, --filename      Be sure to have the .zip file in the postGTFS dir
                      (ex: vmc_export.zip)                   [string] [required]
  -e, --environments  all for all, ps for prod & stage
                      sd for stage & dev
                      p for prod, s for stage, d for dev     [string] [required]
  --help, -h          Show help                                        [boolean]


                      
  $ cd postGTFS/
  $ node postGTFS.js -a [agency] -d [description] -f [filename] -e [environments] < OPTIONAL: -t [time] -s [smoothing] >
  
```
If successful, the script will return something like:
```script
$ Looking up and converting the timezone...
Agency not in Prod!... Checking Stage...
Not in Stage!... Checking Dev...
Ahhhh, I see you have a Dev agency...

Now lets update shape-test's data!

You are updating shape-test for Dev and your id is 1552- THIS UPDATE HAS BEEN SENT TO NB2 Dev

Now...Updating with current status for the import every 10 seconds until COMPLETE, SCHEDULED or ERROR. 

Message id: 
filename: /tmp/gtfs-2019-105-21-22-12.zip authorityProperties: {"distanceConversion":1,"timezone":"America/New_York"}
Using temporary authority 247a0637-2c14-4585-ab28-dc9229ba62d0
Importing Agency.
Importing CalendarDate.
Importing Calendar.
Importing FareAttribute.
Importing FeedInfo.
Importing Route.
Importing FareRule.
Importing Shape.
Importing Point.
Importing Stop.
Importing Transfer.
Importing Trip.
Importing Frequency.
Importing StopTime.
Importing TypedBlock.
Importing RouteInfo.
All import files have been loaded into the database successfully.
The system is ready to change the authority from its temporary name.
Performing post-import processing.
Could not find matching agency for shape-test-1547238061740; nb_agency_id set to null for this agency_info row.
Could not find matching agency for shape-test; nb_agency_id set to null for this agency_info row.


CONGRATULATIONS! Your update has completed for Dev
```
If you schedule an upate you will get:

```script
Import have been scheduled to run at: Thu Apr 18 2019 06:00:00 GMT+0000 for Dev
```
If there is an error, you will get:

```script
#### Your Import did not Complete for Dev! ####
```

---
#### DELETE-Scheduled-Import

Delete a scheduled import in any environment

```script
Options:
  -i, --importId     id for import                           [string] [required]
  -e, --environment  p for prod, s for stage, d for dev      [string] [required]
  
  $ cd scripts/
  $ node delSchedImport.js -i [id] -e [environment]

```
If successful, the script will return:
```script
$ From [environment]: {success: true, error: null}
```
---
#### GET-Route-Predictions-Archive

Using a route id, download as specific agencies route predictions during a timeframe. 

<b>All time is in CST.</b>

```script
Options:
  -a, --agency       NB2 agency (ex: cha)                    [string] [required]
  -r, --routeId      route id given by authority             [string] [required]
  -s, --startDate    "2019-03-04 13:00"- include quotes      [string] [required]
  -f, --endDate      "2019-03-04 14:00"- include quotes      [string] [required]
  -m, --max          max number results for query            [string] [required]
  -e, --environment  p for prod, s for stage, d for dev      [string] [required]
  
  $ cd scripts/
  $ node getRoutePredArchive.js -a [agency] -r [routeId] -s [startDate] -f [endDate] -m [max] -e [environment]
```
If successful, the script will return:
```script
$ Here is your result for route [routeID] in [environment]:
$ Created output/RteArchive[agency]-Route[routeId]-[startDate].csv
```
A ```.csv``` file will be created in ```scripts/output```

An example output is:

```$ node getRoutePredArchive.js -a bigbluebus -r 41 -s "2019-03-04 13:00" -f "2019-03-04 14:00" -m 5 -e p```


|timestamp          |stop|route|vehicle|trip_id    |distance_to_stop|predicted_departure|actual_departure|predicted_arrival|actual_arrival|
|-------------------|----|-----|-------|-----------|----------------|-------------------|----------------|-----------------|--------------|
|2019-03-04 13:59:20|348 |41   |1600   |MoWeFr-771370|9547            |14:31:27           |14:58:32        |14:31:22         |15:31:30      |
|2019-03-04 13:59:19|348 |41   |1600   |MoWeFr-771368|9547            |14:31:11           |MISSING-TIME    |14:31:00         |14:53:25      |
|2019-03-04 13:59:18|1564|41   |1600   |MoWeFr-771368|1244.4          |14:20:49           |14:24:28        |14:20:06         |14:24:28      |
|2019-03-04 13:59:18|991 |41   |1600   |MoWeFr-771368|2428.6          |14:19:41           |14:28:52        |14:19:50         |14:28:52      |
|2019-03-04 13:59:18|1482|41   |1600   |MoWeFr-771368|8880.5          |14:30:12           |14:51:10        |14:29:54         |14:51:10      |

---

#### GET-Vehicle-Predictions-Archive

Using a vehicle id, download a specific agencies vehicle predictions during a timeframe.

<b>All time is in CST.</b>

```script
Options:
  -a, --agency       NB2 agency (ex: cha)                    [string] [required]
  -v, --vehicleId    vehicle id given by authority           [string] [required]
  -s, --startDate    "2019-03-04 13:00"- include quotes      [string] [required]
  -f, --endDate      "2019-03-04 14:00"- include quotes      [string] [required]
  -m, --max          max number results for query            [string] [required]
  -e, --environment  p for prod, s for stage, d for dev      [string] [required]

  
  $ cd scripts/
  $ node getVehiclePredArchive.js -a [agency] -v [vehicleId] -s [startDate] -f [endDate] -m [max] -e [environment]

```
If successful, the script will return:
```script
$ Here is your result for vehicle [vehicleID] in [environment]:
$ Created output/VehArchive[agency]-Veh[vehicleId]-[startDate].csv
```
A ```.csv``` file will be created in ```scripts/output```

An example output is:

```$ node getVehiclePredArchive.js -a bigbluebus -v 1812 -s "2019-03-04 13:00" -f "2019-03-04 14:00" -m 5 -e p```

|timestamp          |stop|route|vehicle|trip_id    |distance_to_stop|predicted_departure|actual_departure|predicted_arrival|actual_arrival|
|-------------------|----|-----|-------|-----------|----------------|-------------------|----------------|-----------------|--------------|
|2019-03-19 09:29:30|43  |3    |1812   |TuTh-784034|12387.1         |10:18:10           |10:22:32        |10:16:46         |10:22:32      |
|2019-03-19 09:29:29|4   |3    |1812   |TuTh-783954|12056.3         |10:12:19           |10:22:16        |10:10:41         |10:19:00      |
|2019-03-19 09:29:29|541 |3    |1812   |TuTh-783954|678.6           |09:29:58           |09:31:10        |09:30:14         |09:30:26      |
|2019-03-19 09:29:29|549 |3    |1812   |TuTh-783954|3832.8          |09:42:05           |09:50:06        |09:40:58         |09:49:21      |
|2019-03-19 09:29:29|430 |3    |1812   |TuTh-784034|13577.6         |10:26:34           |10:25:07        |10:25:10         |10:25:07      |

---


## FAQ

- **What if my I have different passwords for each environment?**
    - If you're going to use these scripts, I'd advise changing your NB2 passwords to all be the same. If you want to keep your passwords different, you can change which API you'd like to get a token for in ```scripts/getToken.js```. 
- **I'm getting an error saying [fill in the blank]**
    - If you get an error message, please read the output to the console. I tried to include error handling, but may have missed some things. If you really get stuck on an error, please contact me.




