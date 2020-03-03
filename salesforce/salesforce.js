// on start command, if "test" was passed as a command param then set boolean as such
console.info(`Running as ${process.env.PROD ? 'PROD' : 'TEST'}`);

const jsforce = require('jsforce');

const {
	SF_URL,
	SF_USER,
	SF_PASS,
	SF_TOKEN,
	SF_SERVICE,
	} = require('./config');

console.log(`\nInitializing Salesforce API\nRoot: ${SF_URL}\nUser: ${SF_USER}`)

module.exports = {
	/**
		*  @description basic Salesforce connection with user pass+token
		*
		* @param old_con {Object} reuse connection (OPTIONAL)
		*
		* @returns jsforce.Connection {Object}
		*/
	connect,

	/**
		* @description execute SOQL query in Salesforce
		*
		* @param query {String} query to send to service (REQUIRED)
		*
		* @param old_con {Object} reuse connection (OPTIONAL)
		*
		* @returns {Object} Promise
		*/
	getSOQLResults,
	getSOQLResultsMore,
	}

/**
	* @description basic Salesforce connection with user pass+token
	*
	* @param old_con {Object} reuse connection (OPTIONAL)
	*
	* @returns jsforce.Connection {Object}
	*/
function connect(old_con) {
	return new Promise((resolve, reject) => {
		const instanceUrl = process.env.instanceUrl ? process.env.instanceUrl : SF_URL;
		const conn = old_con ? old_con : new jsforce.Connection({
			instanceUrl,
			loginUrl: SF_URL
			});

		conn.login(SF_USER, SF_PASS+SF_TOKEN, (err, userInfo) => {
			process.env.accessToken = conn.accessToken;
			process.env.instanceUrl = conn.instanceUrl;

			err ? reject(err) : resolve(conn)
			});
		});
	}

/**
	* @description
	*
	* @param query {String} (REQUIRED)
	*
	* @param old_con {Object} reuse connection (OPTIONAL)
	*
	* @return {Object Promise
	*/
async function getSOQLResults(SOQL, old_con) {
	const conn = old_con ? old_con : await connect();

	return new Promise((resolve, reject) => {
		conn.query(SOQL, async (error, response) => {
			if (error) reject(error);

			if (!response.done) {
				response = await getSOQLResultsMore(response.nextRecordsUrl, conn, response);
				}
			const date = new Date(Date.now());

			resolve(response);
			})
		})
	}

async function getSOQLResultsMore(locator, old_con, response) {
	const conn = old_con ? old_con : await connect();

	return new Promise((resolve, reject) => {
		conn.queryMore(locator, async (error, responseMore) => {
			if (error) reject(error);

			if (!responseMore.done)
				response = await getSOQLResultsMore(responseMore.nextRecordsUrl, conn, response);

			var records = response.records;
			var moreRecords = responseMore.records;
			response.records = records.concat(moreRecords);

			resolve(response);
			})
		})
	}
