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
Arguments : 
- config-dir : Directory containing your config files. Default config files from this package are located under /conf. See below for configuration details.
- data-dir : Directory for result storage, will be created if it does not exists. See below for results details.

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

- Create a docker-compose.yml specifying config-dir and data-dir folders (see below for configuration and results details). For example :
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
For a quick start, you can copy the default config files from this package (/conf-example folder).

### jobs.json
This file defines the jobs to run with lighthouse. Each job must specify the following properties : 
- url : the url to run
- profiles : the list of profiles to run the test with, see below for profile configuration
- cron : the frequency at wich test should be run. Notation is like cron with seconds granularity.

The config file below runs 
- https://www.google.com with mobile configuration every 10 minutes
- https://www.example.com with mobile and desktop configuration every hour
```json
{
    "jobs": [
        {
            "url":"https://www.google.com",
            "profiles":[ "mobile" ],
            "cron": "1 */10 * * * *"
        },
        {
            "url":"https://www.example.com",
            "profiles":[ "mobile", "desktop"],
            "cron": "1 1 */1 * * *"
        }
    ]
}
```

### lightkeeper.json
This file defines the general execution parameters of lighkeeper.
- reports.format : defines lighthouse report format
- logs : defines log reloated configuration
  - logs.params : if set to true, job configuration is written when writting job result
  - logs.fields : list of fields from lighthouse json report to writte as job resul
- webserver.enabled : enables/disables data publishing on webserver
- webserver.port : defines webserver port
- webserver.folders: list of data-dir subfolders to allow access to
- webserver.searchable: if true, adds a /job?id=xxxx&format=yyyy route
- retention.log : log files retention period in days
- retention.reports : reports files retention period in days

Configuration example :
```json
{
    "reports":{
        "formats": ["html", "json", "csv"]
    },
    "logs":{
        "params":true,
        "fields":[
            "categories.performance.score",
            "audits.time-to-first-byte.numericValue",
            "audits.speed-index.numericValue",
            "audits.total-byte-weight.numericValue",
            "audits.dom-size.numericValue"
        ]
    },
    "webserver":{
        "enabled": true,
        "port": 8086,
        "folders": ["reports", "logs", "tmp"],
        "searchable": true
    },
    "retention":{
        "logs": "7",
        "reports": "7"
    }
}
```
### profile.xxxxx.json
The profile.xxxxx.files are lighthouse configuration files. The xxxxx filename part defines the profile name which you can use in jobs.json.

You can add as many profile as you want based on [lighthouse configuration format](https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/configuration.md)

Lightkeeper comes with two example profiles, mobile and desktop, they are identical to [lr-desktop-config.js](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-desktop-config.js) and [lr-mobile-config.js](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-mobile-config.js)


## Results

Every data produced by lightkeeper is stored under the data-dir passed as command argument.
According to lightkeeper.json, the data-dir folder can be exposed through http.

### /log/lightkeeper.log
This is the application log, it monitors job activity, and errors. 
Log example
```log
2019-10-29T21:18:01.244Z|info|No test in queue, waiting ..
2019-10-29T21:19:01.244Z|info|No test in queue, waiting ...
2019-10-29T21:20:01.010Z|info|Job 1572384001010-705 : Adding (mobile) https://www.google.com
2019-10-29T21:20:01.010Z|info|Job 1572384001010-895 : Adding (desktop) https://www.google.com
2019-10-29T21:20:23.251Z|info|Job 1572384001010-705 : Launching : (mobile) https://www.google.com
2019-10-29T21:20:32.985Z|info|Job 1572384001010-705 : Processing (mobile) https://www.google.com
2019-10-29T21:20:32.988Z|info|Job 1572384001010-705 : Ending (mobile) https://www.google.com
2019-10-29T21:20:32.988Z|info|Job 1572384001010-895 : Launching : (desktop) https://www.google.com
2019-10-29T21:20:42.853Z|info|Job 1572384001010-895 : Processing (desktop) https://www.google.com
2019-10-29T21:20:42.855Z|info|Job 1572384001010-895 : Ending (desktop) https://www.google.com
2019-10-29T21:20:42.856Z|info|No test in queue, waiting ...
2019-10-29T21:21:42.856Z|info|No test in queue, waiting ...
```
### /log/results.log
This is the results log, it logs results according to lightkeeper.json configuration file
Log example
```log
1572384001010-705;https://www.google.com;mobile;2019-10-29T21:20:01.010Z;0.97;116.51500000000001;1536.5892489842574;289790;411
1572384001010-895;https://www.google.com;desktop;2019-10-29T21:20:01.010Z;1;117.94599999999997;499.14791362486005;406031;237
```

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

### /tmp
This folder contains the job queue and lighthouse reports before they are moved to /data/reports
