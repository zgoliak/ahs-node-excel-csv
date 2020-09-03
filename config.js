const config = {
	SFTP : {
		HOST : 'localhost',//'host.docker.internal',//
		PORT : 22,
		USER : '',
		PASS : '',
		CONCURRENCY : 0,
		CHUNK_SIZE : 0,
		MODE : '',
		STEP : true,
		LOCAL_PATH : '.',
		REMOTE_PATH : '.'
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
