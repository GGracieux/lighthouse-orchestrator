# Lightkeeper - Lighthouse orchestrator

Lightkeeper is a simple lighthouse job orchestrator made with nodejs.

## Usage

### Launch with CLI

### Prerequisites

- Install Chrome or Chromium
- Install Lighthouse
```bash
npm install -g lighthouse
```
- Install this package
```bash
npm install -g lighthouse-orchestrator
```

### Execution
    
```bash
./lighthouse-keeper \
    --config-dir /your/config/dir \
    --data-dir /your/result/dir
```

#### config-dir
Directory containing your config files, argument defaults to ./conf.
Lightkeeper comes with default configuration files (see /default-conf/jobs.json).
First, defaults files are loaded, then if custom files are found they are overloaded.
See below for configuration details.

#### data-dir
Directory for output storage, argument defaults to ./data.
Folder will be created if it does not exists.
See below for output details.

### Launch with Docker

### Prerequisites

- clone [lighthouse-orchestrator](https://github.com/GGracieux/lighthouse-orchestrator) repository
```bash
git clone git@github.com:GGracieux/lighthouse-orchestrator.git
```
- build dockerfile
```bash
docker build -t lightkeeper .
```

- Create a docker-compose.yml specifying config-dir and data-dir folders (see below for configuration and output details). For example :
```yml
version: '3.2'
services:
  lightkeeper:
    image: lightkeeper
    volumes:
      - /tmp/conf:/lightkeeper/conf:rw
      - /tmp/data:/lightkeeper/data:rw
    ports:
      - 8086:80
```

### Execution
    
- Launch 
```bash
docker-compose up
```

## Configuration

All configuration files must be located under the config-dir passed as command argument.  

### jobs.json
This file defines the jobs to run with lighthouse. Each job must specify the following properties : 
- url : the url to run
- profiles : the list of profiles to run the test with, see below for profile configuration
- cron : the frequency at wich test should be run. Notation is like cron with seconds granularity.

Additional properties can be added, they can be writent to result log according to result log configuration.

If your config-dir does not have a jobs.json file, lightkeeper uses it's default (see /default-conf/jobs.json)

For example the following jobs.json file runs :
- https://www.example.com with mobile configuration every 30 minutes
- https://www.google.com with mobile and desktop configuration every hour
```json
        {
            "url":"https://www.example.com",
            "profiles":[ "mobile"],
            "cron": "1 */30 * * * *"
        },
        {
            "url":"https://www.google.com",
            "profiles":[ "mobile", "desktop"],
            "cron": "1 1 */1 * * *"
        }
```

### lightkeeper.json
This file defines the general execution parameters of lighkeeper.
Lightkeeper loads it's default configuration (see /default-conf/lightkeeper.json) and then overloads it with your custom lightkeeper.json file located under config-dir folder.

#### reports
- reports.formats: lighthouse generated reports format
- reports.retentionDays : number of days reports should be kept.

#### logs
- logs.lightkeeper.retentionDays : number of days /logs/lighthkeeper.log rotated file should be kept.
- logs.results.fields : defines all the fields to output to /logs/results.log
  - run : run related fields : Values can be
    - id : the job id
    - url : tested url (as configured in jobs.json)
    - profile : currently tested profile
    - qdate : date of job enqueuing
    - any custom field added in jobs.json
  - lighthouse : list of fields from lighthouse json report
- logs.results.retentionDays : number of days /logs/results.log rotated file should be kept.
- logs.errors.retentionDays : number of days files located under /logs/errors should be kept.

#### webserver
- webserver.enabled : enables/disables data publishing on webserver
- webserver.port : defines webserver port
- webserver.content.folders: list of data-dir subfolders to allow access to
- webserver.content.searchable: if true, adds a /job?id=xxxx&format=yyyy route
- webserver.authentication.enabled : enables/disables basic authentication
- webserver.authentication.users : a list of user for webserver basic auth, if not provided access is public.
- webserver.https.enabled : enables/disables https
- webserver.https.certificate.key: certificate key path, relative to config-dir
- webserver.https.certificate.crt: certificate path, relative to config-dir
- jobsRunner.maxParallelJobs : max number of simultaneous lighthouse jobs

Configuration example :
```json
{
    "reports":{
        "formats": ["html", "json", "csv"],
        "retentionDays": 7
    },

    "logs":{
        "lightkeeper":{
            "retentionDays": 7
        },
        "results":{
            "fields":{
                "run":[
                    "id",
                    "url",
                    "profile",
                    "qdate"
                ],
                "lighthouse":[
                    "categories.performance.score",
                    "audits.time-to-first-byte.numericValue",
                    "audits.speed-index.numericValue",
                    "audits.total-byte-weight.numericValue",
                    "audits.dom-size.numericValue"
                ]
            },
            "retentionDays": 7
        },
        "errors": {
            "retentionDays": 7
        }
    },

    "webserver":{
        "enabled": true,
        "port": 8086,
        "content": {
            "folders": ["reports", "logs", "queue"],
            "searchable": true
        },
        "authentication": {
            "enabled": true,
            "users": {
                "alice": "123456",
                "bob": "abcdef"
            }
        },
        "https":{
            "enabled": false,
            "certificate": {
                "key":"your-certificate.key",
                "crt":"your-certificate.crt"
            }
        }
    },

    "jobsRunner": {
        "maxParallelJobs": 2
    }
}
```
### profile.xxxxx.json
The profile.xxxxx.json files are lighthouse configuration files. The xxxxx filename part defines the profile name which you can use in jobs.json.

You can add as many profile as you want based on [lighthouse configuration format](https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/configuration.md)

Lightkeeper comes with two default profiles, mobile and desktop, they are identical to [lr-desktop-config.js](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-desktop-config.js) and [lr-mobile-config.js](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-mobile-config.js)

You can add new profiles by writing profile.xxxx.json files under config-dir.
You can overwrite default mobile and desktop files by writing profile.mobile.json and profile.desktop.json under config-dir.


## Output

Every data produced by lightkeeper is stored under the data-dir passed as command argument.
According to lightkeeper.json, the data-dir folder can be exposed through http.

### /logs/lightkeeper.log
This is the application log, it monitors job activity.
Log example
```log
2019-10-29T21:18:01.244Z|info|Worker01, no test in queue, waiting ..
2019-10-29T21:19:01.244Z|info|Worker01, no test in queue, waiting ...
2019-10-29T21:20:01.010Z|info|QManager, Job 1572384001010-705 : Adding (mobile) https://www.google.com
2019-10-29T21:20:01.010Z|info|QManager, Job 1572384001010-895 : Adding (desktop) https://www.google.com
2019-10-29T21:20:23.251Z|info|Worker01, Job 1572384001010-705 : Launching : (mobile) https://www.google.com
2019-10-29T21:20:32.985Z|info|Worker01, Job 1572384001010-705 : Processing (mobile) https://www.google.com
2019-10-29T21:20:32.988Z|info|Worker01, Job 1572384001010-705 : Ending (mobile) https://www.google.com
2019-10-29T21:20:32.988Z|info|Worker01, Job 1572384001010-895 : Launching : (desktop) https://www.google.com
2019-10-29T21:20:42.853Z|info|Worker01, Job 1572384001010-895 : Processing (desktop) https://www.google.com
2019-10-29T21:20:42.855Z|info|Worker01, Job 1572384001010-895 : Ending (desktop) https://www.google.com
2019-10-29T21:20:42.856Z|info|Worker01, no test in queue, waiting ...
2019-10-29T21:21:42.856Z|info|Worker01, no test in queue, waiting ...
```
### /logs/results.log
This is the results log, it logs results according to lightkeeper.json configuration file
Log example
```log
1572384001010-705;https://www.google.com;mobile;2019-10-29T21:20:01.010Z;0.97;116.51500000000001;1536.5892489842574;289790;411
1572384001010-895;https://www.google.com;desktop;2019-10-29T21:20:01.010Z;1;117.94599999999997;499.14791362486005;406031;237
```
### /logs/errors/
This folder contains details on errors, temporary files, etc ...

### /reports
This folder contains a directory stucture as follow : /reports/YYYY/MM/DD/report-files.ext
directory listing example 
```bash
ls -l reports/2019/10/29/
1572384001010-705-mobile-https:www.google.com.csv
1572384001010-705-mobile-https:www.google.com.html
1572384001010-705-mobile-https:www.google.com.json
1572384001010-895-desktop-https:www.google.com.csv
1572384001010-895-desktop-https:www.google.com.html
1572384001010-895-desktop-https:www.google.com.json
```

### /queue
This folder contains the job queue


## Version history

#### version 1.3.1 
- Added this version history

#### version 1.3.0
- Configuration rework, default configuration included and overloads mechanics
- Added https support to webserver
- Added parallel job running option

#### version 1.2.3
- Ignore certificate error to allow testing against unsafe ssl certificates

#### version 1.2.2
- Added basic auth option to webserver

#### version 1.2.1
- Fixed build and installation

#### version 1.2.0
- Added configuration options to webserver
- Enhanced error trace and retention

#### version 1.1.1
- Global installation now available

#### version 1.1.0
- First version taged & published