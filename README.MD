# ahs-node-excel-csv

## Proxy between Disney|HealthFirst and Salesforce

### Purpose

This tool will hit Salesforce to pull data using parameters. This will adapt data to the necessary rules of Disney or FirstHealth using parameters. This will generate files and transfer to SFTP using parameters.

---

## Normal Setup

### Install dependencies

```npm install```

### run for prod

```npm start```

### run for testing in a sandbox

```npm test```

---

## Docker Setup

### docker build

```npm run build-dock```

### docker run

```npm run start-dock```

In the [Dockerfile], there's a CMD commented that uses the ```npm start``` command

---

### Salesforce Info

The ```npm test``` command is will dictate it to use test.salesforce.com and not login.salesforce.com for logging into Salesforce.

---

## Configurations

- docker_node_demo
	* CRON - Details around timezone and param values can be found [here](https://www.npmjs.com/package/node-cron)
		* TIMEZONE - {string} Continent/City of time ([reference](https://github.com/node-cron/tz-offset/blob/master/generated/offsets.json))
		* CSV - {object}
			* PARAM - {string}
		* EXCEL - {object}
			* PARAM - {string}
	* SFTP
		* HOST - URL/DNS Name of destination server
			* Docker to local machine: host.docker.internal
			* On local machine: localhost
		* PORT - Communications port of destination server
		* USER - User name with put privileges on server
		* PASS - User password associated with user name
		* PATH - Path on destination server where file is to be put
- Salesforce
	* SF_USER - {string} User name with API and SOQL privileges on server
	* SF_PASS - {string} User password associated with user name
	* SF_TOKEN - {string} Security token
- CSV-generator
	* LOGS - {array[string]} List of logging outputs for error resolutioning
		* 'verbose' - Outputs JSON structure along the processing
		* 'global' - Outputs during the global rule execution
		* 'rules' - Outputs during the rule execution
		* 'reference' - Outputs during the reference construction
		* 'boardcertify' - Outputs during the Board Certify reference construction
		* 'grouppractice' - Outputs during the Group Practice reference construction
		* 'hospitalaffiliation' - Outputs during the Hospital Affiliation reference construction
		* 'network' - Outputs during the Network reference construction
		* 'language' - Outputs during the Language reference construction
		* 'specialty' - Outputs during the Specialty reference construction
		* 'providertier' - Outputs during the Provider Tier reference construction
		* 'facilityprogram' - Outputs during the Facility Program reference construction
		* 'addresses' - Outputs during the Address construction
	* REFTRANSLATIONS - {array[object]} List of all possible translations for a value from Salesforce
		* column - {string} Matches the Reference being translated
		* value - {string} This string will be matched against Salesforce outputs
		* replace - {string} This string will be inserted into data where {value} is matched, replacing {value}
	* REPORTS - {array[object]} List of all possible outputs to generate CSV for
		* SOQL - {string} Query to execute in Salesforce 
		* FILENAME - {string} Post-fix name of output file
		* CSV_DELIMITER - {string} = ',': Specify an alternate field delimiter such as ; or \t.
			* NOTE When specifying an alternate delimiter you may only pass in a single character delimiter
		* EXTENSION - {string} Extension of file upon creation
		* REFTYPES - {object[objects]} null if not building;
			* BCP - {object} Board Certify Reference (Primary)
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
				* val2 - {string} Map to field in query response for RefVal2 column of reference type
			* BCS - {object} Board Certify Reference (Secondary)
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
				* val2 - {string} Map to field in query response for RefVal2 column of reference type
			* BCT - {object} Board Certify Reference (Tertiary)
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
				* val2 - {string} Map to field in query response for RefVal2 column of reference type
			* GP - {object} Group Practice Reference
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
					* NOTE handles pipe (|) delimited listing for related object fields (i.e. Practice__r.Name)
			* HA - {object} Hospital Affiliation Reference
				* val2 - {string} Map to field in query response for RefVal2 column of reference type
					* NOTE handles pipe (|) delimited listing for all repeat fields
			* N - {object} Network Reference
				* desc - {string} Map to field in query response for RefCodeDesc column of reference type
					* NOTE handles pipe (|) delimited listing for all repeat fields
			* L - {object} Language Reference
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
			* SP - {object} Specialty Reference (Primary)
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
			* SS - {object} Specialty Reference (Secondary)
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
			* ST - {object} Specialty Reference (Tertiary)
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
			* PT - {object} Provider Tier
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
			* FP - {object} Facility Program
				* val1 - {string} Map to field in query response for RefVal1 column of reference type
		* ADDRESSES - {array[]} empty array if not building
			* id - {string} Map to field in query response for Id column
			* address1 - {string} Map to field in query response for Address Line 1 column
			* address2 - {string} Map to field in query response for Address Line 2 column
			* city - {string} Map to field in query response for City column
			* state - {string} Map to field in query response for State column
			* zip - {string} Map to field in query response for Zip column
			* county - {string} Map to field in query response for County column
			* phone - {string} Map to field in query response for Phone column
			* fax - {string} Map to field in query response for Fax column
			* monday - {string} Map to field in query response for Monday Hours column
			* tuesday -  {string} Map to field in query response for Tuesday Hours column
			* wednesday - {string} Map to field in query response for Wednesday Hours column
			* thursday - {string} Map to field in query response for Thursday Hours column
			* friday -  {string} Map to field in query response for Friday Hours column
			* saturday - {string} Map to field in query response for Saturday Hours column
			* sunday - {string} Map to field in query response for Sunday Hours column
		* RULES - See Rules below
	}
- Excel-generator
	* LOGS - {array[string]} List of logging outputs for error resolutioning
		* 'verbose' - Outputs JSON structure along the processing
		* 'global' - Outputs during the global rule execution
		* 'rules' - Outputs during the rule execution
	* REPORT - {object}
		* SOQL - {string} Query to execute in Salesforce 
		* FILENAME - {string} Post-fix name of output file
		* BOOKTYPE - {string} Extension of file upon creation
		* RULES - See Rules below
    
---
## Rules
Here is how you will finalize much of the output content and structure. Once the general structure of the data has been established and implemented the rules will kick in. There are two (2) different types of rules: global - implying every row of the output is affected by them (the few exceptions being concat and append due the nature of their effort); standard - implying not every row is touched or that they may have different outcomes based on their data.
<details>
<summary>Global Rule actions</summary>
+ markdupes: This global rule updates the value of another column if more than one row based on another column exist
  + field: {string} column header to be updated when duplicates are found
  + duplicate: {string} column header to be interrogated for duplicates
  + value: {string} value to be entered into {field} when duplicates are found
+ prepend: This global rule adds a new column with a blank value before
  + field: {string} existing column header
  + column: {string} header for column to be added
+ update: This global rule updates the header of the column
  + field: {string} current column header
  + column: {string} new column header
</details>
<details>
<summary>Standard Rule actions</summary>
+ append:
	+ column: {string} column header for new column added to end of table
+ concat: This rule updates the existing value from a collection of other fields
	+ fields: {string} column header to be updated
	+ concat: {string} comma delimited list of static strings and column headers to be used to construct the final value
+ copy: This rule clones the value from one column to another
	+ field: {string} column header to be update
	+ source: {string} source of copy
+ format:
	+ field: {string} column header to be updated
	+ format: {string} sub-action to be performed
		+ date: converts date string values to YYYYMMDD
		+ nospaces: removes all space characters from content
		+ number: removes all non-numeric characters from content
		+ phone: converts numeric content to (###)###-####
		+ uniqueproviderid: pads the middle identifier with zeros(0) up to 11 characters
+ replace:
	+ field: {string} column header to be updated
	+ operator: {string} sub-action to be performed
		+ today: replaces content with todays date (format: YYYYMMDD)
		+ equals: replaces content with string where previous value matches or previous value was an object
			+ replace: {string} static string to be entered in place of present content
			+ value: {string} static string of possible value to be matched in column
		+ notequals: replaces content with string where previous value does not match
			+ replace: {string} static string to be entered in place of present content
			+ value: {string} static string of possible value to be matched in column
</details>

---
- [Zakee Goliak](mailto:zakee.goliak@coastalcloud.us)