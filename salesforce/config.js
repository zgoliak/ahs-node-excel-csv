const {
	PROD,
	} = process.env;

const config = {
	SF_USER: 'coastalcloud@hps.org.full',
	SF_PASS: 'Coast@l19',
	SF_TOKEN: 'dlL1yga0wADO5j27GLE5pv9xV',
	PROD: PROD === 'true' ? true : false,
	get SF_URL() {
		return this.PROD ? 'https://login.salesforce.com' : 'https://test.salesforce.com'
		},
	}

module.exports = config