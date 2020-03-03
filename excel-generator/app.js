// on start command, if "test" was passed as a command param then set boolean as such
console.info(`Running as ${process.env.PROD === 'true' ? 'PROD' : 'TEST'}`);

const xl = require('xlsx');
const fs = require('fs');

const SF = require('../salesforce/salesforce.js');
const XC = require('../xlsx-compare.js');
const RULES = require('../rules');
const {
	REPORT,
	LOGS
	} = require('./config');

const TABS = ['All','Add','Changes','Delete'];

module.exports = {
	do : do_main
	};

async function do_main() {
	console.log(`Logging enabled for: ${LOGS}`);

	/**
	*  Get data from Salesforce
	*/
	let res = await SF.getSOQLResults(REPORT.SOQL);
	if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
		console.log(`Search Results: ${JSON.stringify(res)}`);

	// Create a new instance of a Workbook class
	const wb = xl.utils.book_new();

	let flag = LOGS.find(log => {return log === 'global';}) !== undefined;
	res = RULES.do_global(res,REPORT.RULES,flag);

	flag = LOGS.find(log => {return log === 'rules';}) !== undefined;
	res.records = res.records.map(record => {
		RULES.do(record,REPORT.RULES,flag);
		return record;
		});

	if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
		console.log(`New results: ${JSON.stringify(res)}`);

	let comp,ret = '';
	let compstat = null;
	const files = fs.readdirSync('.');
	for (let index = 0; index < files.length; index++) {
		let file = files[index];
		if (file.includes('.xlsx') && file !== 'All.xlsx' && !file.includes('~')) {
			let stat = fs.statSync('./' + file);
			if (!stat.isFile) return;
			if (compstat === null || compstat.mtime < stat.mtime) {
				compstat = stat;
				comp = file;
				}
			}
		}

	TABS.forEach((tab, index) => {
		if (comp === undefined && tab !== 'All') return;
		let worksheet = writeExcelSheets(res,tab,comp);
		xl.utils.book_append_sheet(wb, worksheet, tab);

		if (TABS.length === wb.SheetNames.length || tab === 'All') {
			if (tab === 'All') {
				xl.writeFileSync(wb, 'All.xlsx');
				if (comp !== undefined) return;
				}
			let d = new Date(Date.now());
			let timestamp = d.getFullYear()
				+ ((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1)
				+ (d.getDate() < 10 ? '0' : '') + d.getDate();

			let filename = REPORT.FILENAME + timestamp + '.' + REPORT.BOOKTYPE; 
			xl.writeFileSync(wb, filename);
			ret = filename;
			}
		});
	return ret;
	}

function writeExcelSheets(searchresults,tabname,filetocompare) {
	let newrecords = new Array();
	/**
	 *  Transform data to document
	 */
	switch (tabname) {
		case 'Add':
			newrecords = XC.do({
				file2: filetocompare,
				file1: './All.xlsx',
				sheet: 'All',
				changecolumn: 'UniqueProviderID',
				nochangecolumn: ''
				});
			break;
		case 'All':
			newrecords = searchresults.records;
			break;
		case 'Changes':
			newrecords = XC.do({
				file2: filetocompare,
				file1: './All.xlsx',
				sheet: 'All',
				nochangecolumn: 'BillingAddress1',
				changecolumn: 'UniqueProviderID'
				});
			break;
		case 'Delete':
			newrecords = XC.do({
				file1: filetocompare,
				file2: './All.xlsx',
				sheet: 'All',
				changecolumn: 'UniqueProviderID',
				nochangecolumn: ''
				});
			break;
		default:
			break;
		}

	const ws = xl.utils.json_to_sheet(newrecords);
	return ws;
	}
