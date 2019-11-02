# Examples configurations - Default

In order to test, cd into this directory and type "lightkeeper"

- jobs.json defines jobs with a custom property named "category"

- lightkeeper.json defines a minimal result log with the following fields : qqdate;url;profile;category;first-byte;speed-index
 - qdate : date job has been enqueued
 - url : url as in jobs.json
 - profile : profile used for this test, one of those defined in jobs.json
 - category : as in jobs.json custom field category
 - first-byte : value extracted from lighthouse audit report
 - speed-index : value extracted from lighthouse audit report

- lightkeeper.json also defines that results.log field separator should be "|" insead of default ";"