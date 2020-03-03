const config = {
	SFTP : {
		HOST : 'localhost',//'host.docker.internal',//
		PORT : 22,
		USER : 'zakeegoliak',
		PASS : '091810',
		PATH : './Public/'
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