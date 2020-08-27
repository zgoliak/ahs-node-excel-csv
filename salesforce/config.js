const {
	PROD,
	} = process.env;

const config = {
	SF_USER: '',
	SF_PASS: '',
	SF_TOKEN: '',
	PROD: PROD === 'true' ? false : true,
	get SF_URL() {
		return this.PROD ? 'https://login.salesforce.com' : 'https://test.salesforce.com'
		},
	}

module.exports = config
