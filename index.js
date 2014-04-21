var SauceTunnel = require('sauce-tunnel'),
	snapshot	= require('./lib/snapshot')
	;


module.exports = function kodak(info, tunnel)
{
	console.log('oh shit')
	if(!info.url)
		throw new Error('please provide a url to take screenshots from');
	if(!info.browsers)
		throw new Error('please provide a list of browsers to test against');
	if(!info.pages)
		throw new Error('please provide a list of pages to test against');
	if(!info.credentials)
		throw new Error('please provide a valid set of credentials for saucelabs and s3');
	if(!info.credentials.saucelabs)
		throw new Error('please provide a valid set of credentials for saucelabs');
	if(!info.credentials.s3)
		throw new Error('please provide a valid set of credentials for s3');

	var browsers	= info.browsers,
		credentials	= info.credentials,
		pages		= info.pages,
		url			= info.url
		;
	console.log('Waking George Eastman up');
	if(tunnel)
	{
		var tunnelName = tunnel.name || 'tunnel',
			tunnelDebug = tunnel.debug || true,
			connect = new SauceTunnel(credentials.saucelabs.user, credentials.saucelabs.key, tunnelName, 'true', {proxy:'localhost:8080'})
			;
		connect.start(function(status)
		{
			console.log('The tunnel has started');
			if (status === false)
			{
				throw new Error('Something went wrong with the tunnel');
			}
	        console.log('tunnel status : '+ status);
			snapshot(url, browsers, pages, credentials, connect);
		});
	} else
	{
		snapshot(url, browsers, pages, credentials);
	}
};