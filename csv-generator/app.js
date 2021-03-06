const util = require('util');
const stream = require('stream');
const {once} = require('events');
const csv = require('@fast-csv/format');
const fs = require('fs');
const path = require('path');

const SF = require('../salesforce/salesforce');
const RULES = require('../rules');
const {
  LOGS,
  REFTRANSLATIONS,
  REPORTS,
  } = require('./config');

const finished = util.promisify(stream.finished);
const d = new Date(Date.now());
const datestamp = d.getFullYear()
  + ((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1)
  + (d.getDate() < 10 ? '0' : '') + d.getDate();
let header = {}, footer = {};
const headers = ['00','F',datestamp,'L','AHS','Zakee Goliak','zakee.goliak@CoastalCloud.us'];
let footers = ['99',datestamp];

let grulesProcessed = false;

let ret = [];

module.exports = {
  do : do_main
  };

async function writeIterableToFile(iterable, filePath) {
  const writable = fs.createWriteStream(filePath, {encoding: 'utf8'});
  for (const chunk of iterable) {
    if (!writable.write(chunk)) {
      // Handle backpressure
      await once(writable, 'drain');
      }
    }
  writable.end();
  // Wait until done. Throws if there are errors.
  await finished(writable);
  }

let newres = {};
let oldres = {};
let newrec = [];
   
async function do_main() {
  console.log(`Logging enabled for: ${LOGS}`);

  for (let index = 0; index < REPORTS.length; index++) {
    let rep = REPORTS[index];
    /**
      *  Get data from Salesforce
      */
    let res = await SF.getSOQLResults(rep.SOQL);
    if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
      console.log(`Search Results: ${JSON.stringify(res)}`);

    let csv = await writeCSVfile(res, rep);
    ret.push(csv);
    }
    return ret;
  }

async function writeCSVfile(searchresults,report) {
  let newres = getReferences(searchresults,report);
   if (newres === null) {
      if(report.FILENAME === '_FH_ProviderAddress'){
          newres = get_FH_ProviderAddressAddresses(searchresults,report);
      }else if(report.FILENAME === '_FH_AncillaryAddress'){
          newres = get_FH_AncillaryAddressAddresses(searchresults,report);
      }
  }
  if (newres !== null) searchresults = newres;

  if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
    console.log(`New Results: ${JSON.stringify(searchresults)}`);

  searchresults = RULES.do_global(searchresults,report.RULES,LOGS.find(log => {return log === 'global';}) !== undefined);

  searchresults.records = searchresults.records.map(record => {
    RULES.do(record,report.RULES,LOGS.find(log => {return log === 'rules';}) !== undefined);
    return record;
    });

  let keys = Object.keys(searchresults.records[0]);
  footers[2] = searchresults.records.length + 2;
  header = {}, footer = {};
  keys.forEach(buildHeaderFooter);
  searchresults.records.unshift(header);
  searchresults.records.push(footer);

  if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
    console.log(`Final Results: ${JSON.stringify(searchresults)}`);

  let timestamp = d.getFullYear()
    + ((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1)
    + (d.getDate() < 10 ? '0' : '') + d.getDate()
    + (d.getHours() < 10 ? '0' : '') + d.getHours()
    + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  let filename = timestamp + report.FILENAME + (process.env.PROD === 'true' ? '' : '_Test') + report.EXTENSION;

  let opts = {'delimiter' : report.CSV_DELIMITER};

  if (report.WRITE_STREAM) {
    let chunks = [];
    await csv.writeToString(searchresults.records, opts).then(recordstr => {
      if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
        console.log(`Did produce ${recordstr.length} long recordstr: ${recordstr}`);
      let chunkstr = '';
      while (recordstr !== '') {
        chunkstr = recordstr.substr(0, report.CHUNK_SIZE);
        chunks.push(chunkstr);
        recordstr = recordstr.replace(chunkstr, '');
        }
      });

    await writeIterableToFile(chunks, path.resolve('.', filename));
    }
  else {
    await csv.writeToString(searchresults.records, opts).then(async recordstr => {
      let writeRecords = recordstr.split(/\n/);
      if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
        console.log(`Records to write: ${writeRecords.length}`);
      await writeRecords.forEach(recordToWrite => {
        fs.appendFileSync(path.resolve('.', filename), recordToWrite + '\n');
        });
      });
    }

  return filename;
  }

function buildHeaderFooter(key,index) {
  if (headers.length >= index) header[key] = headers[index];
  else header[key] = '';
  if (footers.length >= index) footer[key] = footers[index];
  else footer[key] = '';
  }

function getReferences(res,report) {
  if (report.REFTYPES === null) return null;
  if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
    console.log(`\tBuilding References`);
  var ret = new Object();
  var newrecs = new Array();
  res.records.forEach(record => {
    if (LOGS.find(log => {return log === 'reference'}) !== undefined)
      console.log(`\t\tProcessing Record: ${JSON.stringify(record)}`);
    var gp = getGroupPractice(record,report);
    if (gp !== null) newrecs.push(gp);
    var l = getLanguages(record,report);
    if (l !== null) newrecs = newrecs.concat(l);
    var bc = getBoardCertifiedRows(record,report);
    if (bc !== null) newrecs = newrecs.concat(bc);
    var ha = getHospitalAffiliations(record,report);
    if (ha !== null) newrecs = newrecs.concat(ha);
    var fp = getFacilityProgram(record,report);
    if (fp !== null) newrecs.push(fp);
    var n = getNetworks(record,report);
    if (n !== null) newrecs = newrecs.concat(n);
    
    var s = getSpecialty(record,report);
    if (s !== null) newrecs = newrecs.concat(s);
    var pt = getProviderTier(record,report);
    if (pt !== null) newrecs.push(pt);
    if (LOGS.find(log => {return log === 'reference'}) !== undefined)
      console.log(`\t\treturning ${newrecs.length} References`);
    });
  ret.totalsize = newrecs.length;
  ret.records = newrecs;
  return ret;
  }

function getBoardCertifiedRows(record,report) {
  if (report.REFTYPES.BCP === undefined || record[report.REFTYPES.BCP.val1] === null) return null;
  if (LOGS.find(log => {return log === 'boardcertify'}) !== undefined)
    console.log(`\t\t\tBuilding Board Certifications: ${record[report.REFTYPES.BCP.val1]}`);
  var ret = new Array();
  var newrec = new Object();
  newrec.Type = '11';
  newrec.NPI__c = record.NPI__c;
  newrec.Tax_ID__c = record.Tax_ID__c;
  newrec.Group__c = record.Group__c;
  newrec.RefType = 'Board Certification';
  newrec.RefCode = '01';
  newrec.RefCodeDesc = 'Primary';
  newrec.RefVal1 = record[report.REFTYPES.BCP.val1] === 'Yes' ? 'Y' : 'N';
  newrec.RefVal2 = newrec.RefVal1 === 'Y' ? record[report.REFTYPES.BCP.val2] : '';
  newrec.RefVal3 = null;
  ret.push(newrec);

  if (record[report.REFTYPES.BCS.val1] !== null) {
    if (LOGS.find(log => {return log === 'boardcertify'}) !== undefined)
        console.log(`\t\t\tSecondary: ${record[report.REFTYPES.BCS.val1]}`);
    newrec = new Object();
    newrec.Type = '11';
    newrec.NPI__c = record.NPI__c;
    newrec.Tax_ID__c = record.Tax_ID__c;
    newrec.Group__c = record.Group__c;
    newrec.RefType = 'Board Certification';
    newrec.RefCode = '02';
    newrec.RefCodeDesc = 'Secondary';
    newrec.RefVal1 = record[report.REFTYPES.BCS.val1] === 'Yes' ? 'Y' : 'N';
    newrec.RefVal2 = newrec.RefVal1 === 'Y' ? record[report.REFTYPES.BCS.val2] : '';
    newrec.RefVal3 = null;
    ret.push(newrec);
    }
  if (record[report.REFTYPES.BCT.val1] !== null) {
    if (LOGS.find(log => {return log === 'boardcertify'}) !== undefined)
        console.log(`\t\t\tTertiary: ${record[report.REFTYPES.BCT.val1]}`);
    var newrec = new Object();
    newrec.Type = '11';
    newrec.NPI__c = record.NPI__c;
    newrec.Tax_ID__c = record.Tax_ID__c;
    newrec.Group__c = record.Group__c;
    newrec.RefType = 'Board Certification';
    newrec.RefCode = '03';
    newrec.RefCodeDesc = 'Tertiary';
    newrec.RefVal1 = record[report.REFTYPES.BCT.val1] === 'Yes' ? 'Y' : 'N';
    newrec.RefVal2 = newrec.RefVal1 === 'Y' ? record[report.REFTYPES.BCT.val2] : '';
    newrec.RefVal3 = null;
    ret.push(newrec);
    }
  if (LOGS.find(log => {return log === 'boardcertify'}) !== undefined)
    console.log(`\t\t\tReturning ${ret.length} Board Certifications`);
  return ret;
  }

function getGroupPractice(record,report) {
  if (report.REFTYPES.GP === undefined) return null;
  var values = report.REFTYPES.GP.val1.split('|');
  var value = values.length > 1 ? (record[values[0]] === null ? null : record[values[0]][values[1]]) : record[values[0]];
  if (value === null) return null;
  if (LOGS.find(log => {return log === 'grouppractice'}) !== undefined)
    console.log(`\t\t\tBuilding Group Practice: ${JSON.stringify(value)}`);
  var newrec = new Object();
  newrec.Type = '11';
  newrec.NPI__c = record.NPI__c;
  newrec.Tax_ID__c = record.Tax_ID__c;
  newrec.Group__c = record.Group__c;
  newrec.RefType = 'Group Practice';
  newrec.RefCode = '01';
  newrec.RefCodeDesc = 'Primary';
  newrec.RefVal1 = value;
  newrec.RefVal2 = null;
  newrec.RefVal3 = null;
  if (LOGS.find(log => {return log === 'grouppractice'}) !== undefined)
    console.log(`\t\t\tReturning ${JSON.stringify(newrec)} Group Practice`);
  return newrec;
  } 

function getHospitalAffiliations(record,report) {
  if (report.REFTYPES.HA === undefined) return null;
  var ret = new Array();
  var values = report.REFTYPES.HA.val2.split('|');
  if (record[values[0]] === null) return null;
  if (LOGS.find(log => {return log === 'hospitalaffiliation'}) !== undefined)
    console.log(`\t\t\tBuilding Hospital Affiliations: ${record[values[0]]}`);
  values.forEach((value,index) => {
    if (record[value] === null) return;
    var newrec = new Object();
    newrec.Type = '11';
    newrec.NPI__c = record.NPI__c;
    newrec.Tax_ID__c = record.Tax_ID__c;
    newrec.Group__c = record.Group__c;
    newrec.RefType = 'Hospital Affiliation';
    newrec.RefCode = '0' + (index + 1);
    newrec.RefCodeDesc = ['Primary','Secondary','Tertiary','Multiple'][index > 3 ? 3 : index];
    var trans = REFTRANSLATIONS.find(translation => {
      return translation.column === newrec.RefType && record[value].match(translation.value);
      });
    if (trans === undefined) return null;
    else newrec.RefVal1 = trans.replace;
    newrec.RefVal1 = 'test';
    newrec.RefVal2 = record[value];
    newrec.RefVal3 = null;
    ret.push(newrec);
    });
  if (LOGS.find(log => {return log === 'hospitalaffiliation'}) !== undefined)
    console.log(`\t\t\tReturning ${ret.length} Hospital Affiliations`);
  return ret;
  }

function getNetworks(record,report) {
  if (report.REFTYPES.N === undefined) return null;
  var ret = new Array();
  var values = report.REFTYPES.N.desc.split('|');
  if (record[values[0]] === null) return null;
  if (LOGS.find(log => {return log === 'network'}) !== undefined)
    console.log(`\t\t\tBuilding Networks: ${record[values[0]]}`);
  values.forEach((value,index) => {
    if (record[value] === null) return;
    var newrec = new Object();
    newrec.Type = '11';
    newrec.NPI__c = record.NPI__c === undefined ? record.ContactID__c : record.NPI__c;
    if (record.Tax_ID__c !== undefined) newrec.Tax_ID__c = record.Tax_ID__c;
    if (record.Group__c !== undefined) newrec.Group__c = record.Group__c;
    newrec.RefType = 'Network';
    newrec.RefCode = '0' + (index + 1);
    newrec.RefCodeDesc = ['FHCA Group Plans','FHCA Medicare Advantage Plans','Florida Hospital Employee Plans','Rosen Hotels and Resorts Health Care Plans'][index > 3 ? 3 : index];
    newrec.RefVal1 = record[value] === 'Yes' ? 'Y' : 'N';
    newrec.RefVal2 = null;
    newrec.RefVal3 = null;
    ret.push(newrec);
    });
  if (LOGS.find(log => {return log === 'network'}) !== undefined)
    console.log(`\t\t\tReturning ${ret.length} Networks`);
  return ret;
  }

function getLanguages(record,report) {
  if (report.REFTYPES.L === undefined) return null;
  var val = record[report.REFTYPES.L.val1];
  if (val !== null) values = val.split(',');
  if (values[0] === null) return null;
  var ret = new Array();
  if (LOGS.find(log => {return log === 'language'}) !== undefined)
    console.log(`\t\t\tBuilding Languages: ${values[0]}`);
  values.forEach((value,index) => {
    if (value === null) return;
    var newrec = new Object();
    newrec.Type = '11';
    newrec.NPI__c = record.NPI__c;
    newrec.Tax_ID__c = record.Tax_ID__c;
    newrec.Group__c = record.Group__c;
    newrec.RefType = 'Language';
    newrec.RefCode = '0' + (index + 1);
    newrec.RefCodeDesc = ['Primary','Secondary','Tertiary','Multiple'][index > 3 ? 3 : index];
    var trans = REFTRANSLATIONS.find(translation => {
      return translation.column === newrec.RefType && translation.value === value;
      });
    if (trans === undefined) return null;
    else newrec.RefVal1 = trans.replace;
    newrec.RefVal2 = value;
    newrec.RefVal3 = null;
    ret.push(newrec);
    });
  if (LOGS.find(log => {return log === 'language'}) !== undefined)
    console.log(`\t\t\tReturning ${ret.length} Languages`);
  return ret;
  }

function getSpecialty(record,report) {
  if (report.REFTYPES.SP === undefined || record[report.REFTYPES.SP.val1] === null) return null;
  if (LOGS.find(log => {return log === 'specialty'}) !== undefined)
    console.log(`\t\t\tBuilding Specialties: ${record[report.REFTYPES.SP.val1]}`);
  var ret = new Array();
  var newrec = new Object();
  newrec.Type = '11';
  newrec.NPI__c = record.NPI__c;
  newrec.Tax_ID__c = record.Tax_ID__c;
  newrec.Group__c = record.Group__c;
  newrec.RefType = 'Specialty';
  newrec.RefCode = '01';
  newrec.RefCodeDesc = 'Primary';
  var trans = REFTRANSLATIONS.find(translation => {
    return translation.column === newrec.RefType && translation.value === record[report.REFTYPES.SP.val1];
    });
  if (trans === undefined) return null;
  else newrec.RefVal1 = trans.replace;
  newrec.RefVal2 = record[report.REFTYPES.SP.val1];
  newrec.RefVal3 = null;
  ret.push(newrec);

  if (record[report.REFTYPES.SS.val1] !== null) {
    if (LOGS.find(log => {return log === 'specialty'}) !== undefined)
      console.log(`\t\t\tSecondary: ${record[report.REFTYPES.SS.val1]}`);
    newrec = new Object();
    newrec.Type = '11';
    newrec.NPI__c = record.NPI__c;
    newrec.Tax_ID__c = record.Tax_ID__c;
    newrec.Group__c = record.Group__c;
    newrec.RefType = 'Specialty';
    newrec.RefCode = '02';
    newrec.RefCodeDesc = 'Secondary';
    var trans = REFTRANSLATIONS.find(translation => {
      return translation.column === newrec.RefType && translation.value === record[report.REFTYPES.SS.val1];
      });
    if (trans === undefined) return null;
    else newrec.RefVal1 = trans.replace;
    newrec.RefVal2 = record[report.REFTYPES.SS.val1];
    newrec.RefVal3 = null;
    ret.push(newrec);
    }
  if (record[report.REFTYPES.ST.val1] !== null) {
    if (LOGS.find(log => {return log === 'specialty'}) !== undefined)
      console.log(`\t\t\tTertiary: ${record[report.REFTYPES.ST.val1]}`);
    var newrec = new Object();
    newrec.Type = '11';
    newrec.NPI__c = record.NPI__c;
    newrec.Tax_ID__c = record.Tax_ID__c;
    newrec.Group__c = record.Group__c;
    newrec.RefType = 'Specialty';
    newrec.RefCode = '03';
    newrec.RefCodeDesc = 'Tertiary';
    var trans = REFTRANSLATIONS.find(translation => {
      return translation.column === newrec.RefType && translation.value === record[report.REFTYPES.ST.val1];
      });
    if (trans === undefined) return null;
    else newrec.RefVal1 = trans.replace;
    newrec.RefVal2 = record[report.REFTYPES.ST.val1];
    newrec.RefVal3 = null;
    ret.push(newrec);
    }
  if (LOGS.find(log => {return log === 'specialty'}) !== undefined)
    console.log(`\t\t\tReturning ${ret.length} Specialty`);
  return ret;
  }

function getProviderTier(record,report) {
  if (report.REFTYPES.PT === undefined || record[report.REFTYPES.PT.val1] === null) return null;
  if (LOGS.find(log => {return log === 'providertier'}) !== undefined)
    console.log(`\t\t\tBuilding Provider Tier: ${record[report.REFTYPES.PT.val1]}`);
  var newrec = new Object();
  newrec.Type = '11';
  newrec.NPI__c = record.NPI__c;
  newrec.Tax_ID__c = record.Tax_ID__c;
  newrec.Group__c = record.Group__c;
  newrec.RefType = 'ProviderTier';
  newrec.RefCode = '01';
  newrec.RefCodeDesc = 'Primary';
  var trans = REFTRANSLATIONS.find(translation => {
    return translation.column === newrec.RefType && translation.value.includes(record[report.REFTYPES.PT.val1]);
    });
  if (trans === undefined) return null;
  else newrec.RefVal1 = trans.replace;
  newrec.RefVal2 = record[report.REFTYPES.PT.val1];
  newrec.RefVal3 = null;
  if (LOGS.find(log => {return log === 'providertier'}) !== undefined)
    console.log(`\t\t\tReturning ${JSON.stringify(newrec)} Provider Tier`);
  return newrec;
  }

function getFacilityProgram(record,report) {
  if (report.REFTYPES.FP === undefined || record[report.REFTYPES.FP.val1] === undefined) return null;
  if (LOGS.find(log => {return log === 'facilityprogram'}) !== undefined)
    console.log(`\t\t\tBuilding Facility Program: ${record[report.REFTYPES.FP.val1]}`);
  var newrec = new Object();
  newrec.Type = '11';
  newrec.NPI__c = record.ContactID__c;
  newrec.RefType = 'FacilityProgramType';
  var trans = REFTRANSLATIONS.find(translation => {
    return translation.column === newrec.RefType && translation.value.includes(record[report.REFTYPES.FP.val1]);
    });
  if (trans === undefined) return null;
  else newrec.RefCode = '01';
  //newrec.RefCode = '01 ' + ' .RefType = ' + newrec.RefType + ' trans ' + trans + ' report.REFTYPES.FP.val1 = ' + report.REFTYPES.FP.val1 + ' ' + record[report.REFTYPES.FP.val1]; //+ ' val1 = ' + record[report.REFTYPES.FP.val1];
  newrec.RefCodeDesc = 'Primary';
  newrec.RefVal1 = trans.replace;
  //newrec.RefVal1 = 'test';
  newrec.RefVal2 = record[report.REFTYPES.FP.val1];
  //newrec.RefVal2 = 'test';
  newrec.RefVal3 = null;
  if (LOGS.find(log => {return log === 'facilityprogram'}) !== undefined)
    console.log(`\t\t\tReturning ${JSON.stringify(newrec)} Facility Program`);
  return newrec;
  }
 
var tmpNPI;
var tmpIndex;
var tmpTester;
function get_FH_ProviderAddressAddresses(res,report) {
   tmpIndex = 0;
  if (report.ADDRESSES.length <= 0) return null;
  if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
    console.log(`\tBuilding Addresses`);
  var ret = new Object();
  var newrecs = new Array();
  res.records.forEach(record => {
    if (LOGS.find(log => {return log === 'addresses'}) !== undefined)
      console.log(`\t\tProcessing Record: ${JSON.stringify(record)}`);
    report.ADDRESSES.forEach((address,index) => {
      if (record[address.address1] === null || record[address.address1 === undefined]) return;
      if(tmpNPI === undefined){
          tmpNPI = record[address.id];
      }
      if(tmpNPI === record[address.id]){
         tmpTester = '0' + (tmpIndex + 1);
      }else{
          tmpNPI = record[address.id];
          tmpIndex = 0;
          tmpTester = '0' + (tmpIndex + 1);
      }
      
      var newrec = new Object();
      newrec.Type = '11';
      newrec.NPI__c = record[address.id];
      if (record.Tax_ID__c !== undefined) {
              newrec.Tax_ID__c = record.Tax_ID__c;
             
        }
      if (record.Group__c !== undefined) newrec.Group__c = record.Group__c;
      newrec.AddressType = tmpTester;
      newrec.AddressTypeDesc = ['Primary Office','Secondary Office','Third Office','Fourth Office','Fifth Office','Sixth Office','Seventh Office','Eighth Office'][tmpIndex];
      if (record.GroupNPI__c !== undefined) newrec.LocationNPI = record.GroupNPI__c;
      if (record.GroupName__c !== undefined) newrec.GroupName = record.GroupName__c;
      if (record.Tax_ID__c === undefined) newrec.AddressSeq = newrec.AddressType;
      newrec.Address1 = record[address.address1];
      newrec.Address2 = record[address.address2];
      newrec.City = record[address.city];
      newrec.State = record[address.state];
      newrec.Zip = record[address.zip];
      newrec.County = record[address.county];
      if(record[address.phone] != null){
        newrec.Phone = record[address.phone].replace('-','').replace('(','').replace(')','');
      }else{
          newrec.Phone = record[address.phone];
      }
      
      
      if (address.fax !== undefined){
          newrec.Fax = record[address.fax] +'';
          newrec.Fax = newrec.Fax.replace('-','').replace('(','').replace(')','');
      }
      var hours = getValidOfficeHours(record[address.monday]);
      if (hours === null) return null;
      else newrec.MonOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.tuesday]);
      if (hours === null) return null;
      else newrec.TueOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.wednesday]);
      if (hours === null) return null;
      else newrec.WedOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.thursday]);
      if (hours === null) return null;
      else newrec.ThuOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.friday]);
      if (hours === null) return null;
      else newrec.FriOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.saturday]);
      if (hours === null) return null;
      else newrec.SatOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.sunday]);
      if (hours === null) return null;
      else newrec.SunOfficeHours = hours;
      newrec.PracticeWebsite = record.Website__c;
      if (LOGS.find(log => {return log === 'addresses'}) !== undefined)
        console.log(`\t\treturning ${JSON.stringify(newrec)} Address`);
        tmpIndex++;
      newrecs.push(newrec);
      });
    if (LOGS.find(log => {return log === 'addresses'}) !== undefined)
      console.log(`\t\treturning ${newrecs.length} Addresses`);
    });
  ret.totalsize = newrecs.length;
  ret.records = newrecs;
  return ret;
  }
  
  function get_FH_AncillaryAddressAddresses(res,report) {
  if (report.ADDRESSES.length <= 0) return null;
  if (LOGS.find(log => {return log === 'verbose'}) !== undefined)
    console.log(`\tBuilding Addresses`);
  var ret = new Object();
  var newrecs = new Array();
  res.records.forEach(record => {
    if (LOGS.find(log => {return log === 'addresses'}) !== undefined)
      console.log(`\t\tProcessing Record: ${JSON.stringify(record)}`);
    report.ADDRESSES.forEach((address,index) => {
      if (record[address.address1] === null || record[address.address1 === undefined]) return;
      var newrec = new Object();
      newrec.Type = '11';
      newrec.NPI__c = record[address.id];
      if (record.Tax_ID__c !== undefined) newrec.Tax_ID__c = record.Tax_ID__c;
      if (record.Group__c !== undefined) newrec.Group__c = record.Group__c;
      newrec.AddressType = index < 5 ? '0' + (index + 1) : '90';
      newrec.AddressTypeDesc = ['Primary','Secondary','Third','Fourth','Fifth','Billing'][index];
      if (record.GroupNPI__c !== undefined) newrec.LocationNPI = record.GroupNPI__c;
      if (record.GroupName__c !== undefined) newrec.GroupName = record.GroupName__c;
      if (record.Tax_ID__c === undefined) newrec.AddressSeq = newrec.AddressType;
      newrec.Address1 = record[address.address1];
      newrec.Address2 = record[address.address2];
      newrec.City = record[address.city];
      newrec.State = record[address.state];
      newrec.Zip = record[address.zip];
      newrec.County = record[address.county];
      newrec.Phone = record[address.phone];
      if (address.fax !== undefined) newrec.Fax = record[address.fax];
      var hours = getValidOfficeHours(record[address.monday]);
      if (hours === null) return null;
      else newrec.MonOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.tuesday]);
      if (hours === null) return null;
      else newrec.TueOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.wednesday]);
      if (hours === null) return null;
      else newrec.WedOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.thursday]);
      if (hours === null) return null;
      else newrec.ThuOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.friday]);
      if (hours === null) return null;
      else newrec.FriOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.saturday]);
      if (hours === null) return null;
      else newrec.SatOfficeHours = hours;
      var hours = getValidOfficeHours(record[address.sunday]);
      if (hours === null) return null;
      else newrec.SunOfficeHours = hours;
      newrec.PracticeWebsite = record.Website__c;
      if (LOGS.find(log => {return log === 'addresses'}) !== undefined)
        console.log(`\t\treturning ${JSON.stringify(newrec)} Address`);
        if(newrec.AddressTypeDesc == 'Primary' || newrec.AddressTypeDesc == 'Billing'){
            newrecs.push(newrec);
        }
      });
    if (LOGS.find(log => {return log === 'addresses'}) !== undefined)
      console.log(`\t\treturning ${newrecs.length} Addresses`);
    });
        ret.totalsize = newrecs.length;
        ret.records = newrecs;
        //if(newrec.AddressTypeDesc == 'Primary' || newrec.AddressTypeDesc == 'Billing'){
            return ret;
  }

function getValidOfficeHours(hours) {
  if (LOGS.find(log => {return log === 'addresses'}) !== undefined)
    console.log(`\t\tGetting Valid Office Hours\n\t\t\tHours: ${hours}`);
  if (hours === undefined || hours === null || hours === '' || hours.length <10) return '00:00 AM - 00:00 PM';
  //if (hours.length === 19 && hours.match(/[\d]{1,2}:[\d]{1,2} [?A|P]M/g).length > 1) return hours;
  if (hours.length > 16 && hours.match(/[\d]{1,2}:[\d]{1,2} [?A|P]M/g).length > 1) return hourFormat(hours);
  return null;
  }
  
function hourFormat(hour){
  //console.log(hour);
  var lstSplit1 = hour.split('-');
  var timeFormat = '';
  for( x in lstSplit1){
    //console.log(x);
    //console.log(lstSplit1);
    var lstSplit2 = lstSplit1[x].split(':');
    //console.log(lstSplit2);
    var intVar1 = parseInt(lstSplit2[0]);
    //console.log(intVar1);
    if(intVar1 < 10){
      intVar1 = '0' + intVar1 + ':' + lstSplit2[1];
      //console.log(intVar1);
      timeFormat = timeFormat + '+ ' + intVar1;
      }
    }
  timeFormat = timeFormat.substr(1,timeFormat.length).replace('+','-');
  return timeFormat;
  }