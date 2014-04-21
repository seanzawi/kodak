var creds		= require('../../credentials.js'),
	fs			= require('fs'),
	key			= creds.saucelabs.key,
	knox		= require('knox'),
	path		= require('path'),
	request		= require('request'),
	saucelabs	= require('../saucelabs/index.js'),
	user		= creds.saucelabs.user
	;

module.exports	= function getPictures(info)
{
	console.log(info);
	var job			= info.id,
		browser		= info.browser,
		os			= info.os,
		version		= info.version,
		commit		= info.commit,
		repo		= info.repo,
		pageList	= Object.keys(info.pages)
		;
		browser = browser.split(' ').join('-');
		os = os.split(' ').join('-');

	var client = knox.createClient({
        key: creds.s3.key,
        secret:creds.s3.secret,
        bucket: creds.s3.bucket
    });

	var myAccount = new saucelabs({
		username: user,
		password: key
	});
	function downloadAssets(error, assets)
	{
		var screenshots = assets.screenshots;
		if(error)
			console.log(error.error);
		if(screenshots==='' || screenshots===[])
			console.log('It looks like there weren\'t any screenshots generated');
		console.log('Downloading assets from job : ' + job);
		var pages = pageList;
		screenshots.forEach(function(value, index)
		{
			var odd = index%2;
			if(odd)
			{
				var page = pages.shift();
				// var s3name = path.join(repo, commit, Date.now(), page, browser + '-' + version, value);
				var s3name = repo + '/' + commit + '/' + Date.now() + '/' + page + '/' + browser + '-' + version + '/' + value;
				var fspartial = s3name.split('/').join('-');
				console.log(fspartial);
				fs.exists('results', function (exists)
				{
					if(!exists)
						fs.mkdirSync('results');

					var fsName = 'results/' + fspartial;
					request('https://'+user+':'+key+'@saucelabs.com/rest/v1/'+
						user+'/jobs/'+job+'/assets/'+value)
					.pipe(fs.createWriteStream(fsName));
					setTimeout(function()
					{
						fs.stat(fsName, function(err, stat)
						{
							if(err)
								throw err;
							var req = client.put(s3name, {
								'Content-Length': stat.size,
								'Content-Type': 'text/plain',
								'x-amz-acl':'public-read'
							});

							fs.createReadStream(fsName).pipe(req);

							req.on('response', function(res){
								if(res.statusCode===200)
								{
									fs.unlink(fsName, function (err) {
										if (err) throw err;
										console.log('successfully deleted ' + fsName);
									});
								} else
								{
									console.log('Response from s3 is : ' + res.statusCode);
								}
							});
						});
					},10*1000);
				});
			}
		});
	}
	myAccount.showJob(job, getAssetList);
	function getAssetList(error, results)
	{
		if(error)
		{
			console.log(error);
		}
		if(results.status==='complete')
		{
			console.log('Job ' + job + ' is done, grabbing assets now.');
			myAccount.showJobAssets(job, downloadAssets);
		} else if(results.status==='in progress')
		{
			console.log('Waiting for job ' + job + ' to terminate before getting the assets.');
			setTimeout(function()
			{
				myAccount.showJob(job, getAssetList);
			},30*1000);
		} else
		{
			console.log('It looks like there was an issue "' + results.status + '" with job ' + job);
		}
	}
};