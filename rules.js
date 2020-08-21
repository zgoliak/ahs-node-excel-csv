module.exports = {
	do : do_main,
	do_global : do_global
	};

function do_global (results,rules,LOGS) {
	var rules = rules.filter(rule => { return 'prepend|update|markdupes'.includes(rule.action); });
	if (LOGS)
		console.log(`\tGlobal Rules: ${JSON.stringify(rules)}`);

	if (rules !== undefined) {
		rules.forEach(rule => {
			if (LOGS)
				console.log(`\tRule executing:\n\t\tAction: ${rule.action}\n\t\tField: ${rule.field}`);
			switch (rule.action) {
				case 'update':
					results = JSON.parse(JSON.stringify(results).split(rule.field).join(rule.column));
					break;
				case 'prepend':
					results = JSON.parse(JSON.stringify(results).split(rule.field).join(rule.column + '":"","' + rule.field));
					break;
				case 'markdupe':
					results.records.forEach(record => {
						var dupes = results.records.filter(rec => {
							return record[rule.duplicate] === rec[rule.duplicate]
							});
						if (dupes.length > 1) record[rule.field] = rule.value;
						});
					return results;
					break;
				default:
					break;
				}
			});
		}
	if (LOGS)
		console.log(`Global Results: ${JSON.stringify(results)}`);
	return results;
	}

function do_main (record,rules,LOGS) {
	var rules = rules.filter((rule,index) => {
		try {
			if ('prepend|update|markdupe'.includes(rule.action)) return false;
			return rule.action !== 'replace' || rule.operator !== 'equals' ||
				(typeof record[rule.field] === 'object' && record[rule.field] !== null) || 
				(record[rule.field] !== null && record[rule.field].includes(rule.value));
			}
		catch(err) { console.error(`Error Occurred:\n\tMessage: ${err}\n\tRecord: ${JSON.stringify(record)}\n\tRule: ${JSON.stringify(rule)}`)};
		});

	if (LOGS)
		console.log(`\tRules to execute for record:\n\t\t${JSON.stringify(rules)}`);

	rules.forEach(rule => {
		try {
			switch (rule.action) {
				case 'replace':
					do_replace(record,rule,LOGS);
					break;
				case 'format':
					do_format(record,rule,LOGS);
					break;
				/* case 'remove':
					*  var column = ',"' + rule.field + '": ';
					*  var value = record[rule.field];
					*  if (value !== null) column += '"' + value + '"';
					*  else column += value;
					*  if (LOGS)
					*       console.log(`Record: ${JSON.stringify(record)}\n\tField: ${rule.field}\n\tColumn: ${column}`);
					*  record = JSON.parse(JSON.stringify(record).split(column).join());
					*  break;*/
				case 'append':
					record = do_append(record,rule,LOGS);
					break;
				case 'concat':
					do_concat(record,rule,LOGS);
					break;
				case 'copy':
					if (LOGS)
						console.log(`\tRule executing:\n\t\tAction: ${rule.action}\n\t\tSource: ${rule.source}\n\t\tField: ${rule.field}\n\t\tCurrent: ${record[rule.field]}`);
					record[rule.field] = record[rule.source];
					break;
				case 'update':
				case 'prepend':
				case 'markdupe':
					if (LOGS)
						console.warn(`\tAction '${rule.action}' completed under global rules`);
					break;
				default:
					console.warn(`\tAction '${rule.action}' not supported`);
					break;
				}
			}
		catch (err) {
			console.error(`Error Occurred:\n\tMessage: ${err}\n\tRecord: ${JSON.stringify(record)}\n\tRule: ${JSON.stringify(rule)}`);
			}
		});
	}

function do_concat(record,rule,LOGS) {
	if (LOGS)
		console.log(`\tRule executing:\n\t\tAction: ${rule.action}\n\t\tOperator: ${rule.concat}\n\t\tField: ${rule.field}\n\t\tCurrent: ${record[rule.field]}`);
	const concats = rule.concat.split(',');
	let ret = '';
	concats.forEach(concat => {
		let value = (record[concat] !== undefined ? record[concat] : concat);
		ret += value;
		});
	record[rule.field] = ret;
	if (LOGS)
		console.log(`\tRule executed:\n\t\tResults: ${JSON.stringify(record)}`);
	}

function do_replace(record,rule,LOGS) {
	if (LOGS)
		console.log(`\tRule executing:\n\t\tAction: ${rule.action}\n\t\tOperator: ${rule.operator}\n\t\tField: ${rule.field}`);
	switch (rule.operator) {
		case 'equals':
			if (typeof record[rule.field] === 'object' || record[rule.field].includes(rule.value))
				record[rule.field] = rule.replace;
			break;
		case 'notequals':
			if (record[rule.field] !== '' && record[rule.field] !== null && record[rule.field] !== rule.value)
				record[rule.field] = rule.replace;
			break;
		case 'today':
			let d = new Date(Date.now());
			record[rule.field] = d.getFullYear()
				+ (d.getMonth() < 10 ? '0' : '') + d.getMonth()
				+ (d.getDate() < 10 ? '0' : '') + d.getDate();
			break;
		default:
			break;
		}
	if (LOGS)
		console.log(`\tRule executed:\n\t\tResults: ${record[rule.field]}`);
	}

function do_format(record,rule,LOGS) {
	if (record[rule.field] === '' || record[rule.field] === null) return;
	if (LOGS)
		console.log(`\tRule executing:\n\t\tAction: ${rule.action}\n\t\tOperator: ${rule.format}\n\t\tField: ${rule.field}\n\t\tCurrent: ${record[rule.field]}`);
	let ret = '';
	switch (rule.format) {
		case 'date':
			do_format_date(record,rule,LOGS);
			break;
		case 'number':
			record[rule.field] = record[rule.field].replace(/[^\d]/g, '');
			break;
		case 'uniqueproviderid':
			ret = record[rule.field].replace(/[^\d-]/g, '');
			let mid = ret.substring(11);
			let old = mid;
			while (mid.length < 21) {mid = '0' + mid;}
			record[rule.field] = ret.replace(old, mid);
			break;
		case 'nospaces':
			record[rule.field] = record[rule.field].replace(/ /g, '');
			break;
		case 'phone':
			let value = record[rule.field];
			ret = value;
			if (value.match(/\(\d{3}\)\d{3}\-\d{4}/) === null) {
				value = value.replace(/[^\d]/g, '');
				if (value.length === 10)
					ret = '('.concat(value.slice(0,2),')',value.slice(3,5),'-',value.slice(6,9));
				}
			record[rule.field] = ret;
			break;
		default:
			console.warn(`\tFormat '${rule.format}' not supported`);
			break;
		}
	if (LOGS)
		console.log(`\tRule executed:\n\t\tAction: ${rule.action}\n\t\tFormat: ${rule.format}\n\t\tField: ${rule.field}\n\t\tResults: ${record[rule.field]}`);
	}

function do_format_date(record,rule,LOGS) {
	let date = Date.parse(record[rule.field]);
	if (!isNaN(date)) {
		let d = new Date(record[rule.field]);
		record[rule.field] = d.getFullYear()
			+ (d.getMonth() < 10 ? '0' : '') + (d.getMonth() + 1)
			+ (d.getDate() < 10 ? '0' : '') + d.getDate();
		}
	}

function do_append(record,rule,LOGS) {
	if (LOGS)
		console.log(`\tRule executing:\n\t\tAction: ${rule.action}\n\t\tOperator: ${rule.column}`);
	record[rule.column] = '';
	if (LOGS)
		console.log(`\tRule executed:\n\t\tResults: ${record}`);
	}
