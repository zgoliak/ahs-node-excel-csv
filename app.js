process.env.PROD = process.argv.every(s => s.toLowerCase() !== 'test');

// on start command, if "test" was passed as a command param then set boolean as such
console.info(`Running as ${process.env.PROD === 'true' ? 'PROD' : 'TEST'}`);

// const cron = require('node-cron');
const client = require('ssh2').Client;
const cron = require('node-cron');
const path = require('path');

const csv = require('./csv-generator/app.js');
const excel = require('./excel-generator/app.js');
const {
	SFTP,
	CRON
	} = require('./config');

const config = {
	'host' : SFTP.HOST,
	'port' : SFTP.PORT,
	'secure' : true,
	'user' : SFTP.USER,
	'password' : SFTP.PASS
	};

function main() {
	console.log(`Setting cron to ${CRON.EXCEL.PARAM} in ${CRON.TIMEZONE}\nCRON VALIDATE: ${cron.validate(CRON.EXCEL.PARAM)}`);
	cron.schedule(CRON.EXCEL.PARAM, async function() {
		let result = await excel.do();
		sshFile(result);
		},
	{
		scheduled : true,
		timezone : CRON.TIMEZONE
		});
	console.log(`Setting cron to ${CRON.CSV.PARAM} in ${CRON.TIMEZONE}\nCRON VALIDATE: ${cron.validate(CRON.CSV.PARAM)}`);
	cron.schedule(CRON.CSV.PARAM, async function() {
		result = await csv.do();
		console.log(result);
		result.forEach(file => {sshFile(file)});
		},
	{
		scheduled : true,
		timezone : CRON.TIMEZONE
		});
	}

async function sshFile(file) {
	/**
	 *  Move document to SFTP
	 */
	const c = new client();
	c.on('ready', () => {
		c.sftp(function(err, sftp) {
			if (err) throw err;
			let options = {};
			if (SFTP.CONCURRENCY !== 0) options.concurrency = SFTP.CONCURRENCY;
			if (SFTP.CHUNK_SIZE !== 0) options.chunkSize = SFTP.CHUNK_SIZE;
			if (SFTP.MODE !== '') options.mode = SFTP.MODE;
			if (SFTP.STEP) options.step = function (trans, chunk, total) { console.log(`Total Transferred: ${trans}\nChunks: ${chunk}\nTotal: ${total}`); };
			sftp.fastPut(path.resolve(SFTP.LOCAL_PATH + file), path.resolve(SFTP.REMOTE_PATH + file), options, function(err) {
				if (err) throw err;
				console.log(`Success pushing ${file} to server`);
				c.end();
				});
			});
		});
	c.connect(config);
	}

main();
