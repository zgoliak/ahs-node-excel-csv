const config = {
	SFTP : {
		HOST : 'localhost',//'host.docker.internal',//
		PORT : 22,
		USER : '',
		PASS : '',
		PATH : ''
		},
	CRON : {
		TIMEZONE : 'America/Chicago',
		EXCEL : {
			PARAM : '* * * * *'
			},
		CSV : {
			PARAM : '* * * * *'
			}
		}
	}

module.exports = config
