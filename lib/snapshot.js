var soda        = require('soda'),
    upload      = require('./upload')
    ;
module.exports = function(url, browsers, pages, creds, connect)
{

    console.log('taking snapshots');
    browsers.forEach(function(browser_info, index)
    {
        console.log('browser info');
        console.log(browser_info);
        var browser = soda.createSauceClient(
        {
            'host'              : url.host,
            'port'              : url.port,
            'url'               : url.url,
            'username'          : creds.saucelabs.user,
            'access-key'        : creds.saucelabs.key,
            'os'                : browser_info.os,
            'browser'           : browser_info.browser,
            'browser-version'   : browser_info.version,
            'max-duration'      : 120,
            'record-video'      : false,
            'name'              : url.repo + '-' + url.commit
        });
        console.log(browser);

        browser.on('command', function(cmd, args){
            console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
        });
        browser.on('finished', function(jobInfo)
        {
            console.log(jobInfo);
        });
        browser
            .chain
            .session();
        
        Object.keys(pages).forEach(function(pageName, i)
        {
            var page = pages[pageName];
            browser
            .open(page)
            .captureEntirePageScreenshot(page);

            if(i === Object.keys(pages).length-1)
            {
                browser
                .end(function(err){
                if(err)
                {
                    console.log('error :'+err);
                }
                console.log(this.sid);
                var jobInfo = 
                {
                    id:         this.sid,
                    os:         browser_info.os,
                    browser:    browser_info.browser,
                    version:    browser_info.version,
                    repo:       url.repo,
                    commit:     url.commit,
                    pages:      pages
                };                  
                browser.emit('finished', jobInfo);
                browser.testComplete(function()
                {
                    console.log('Session terminated, job complete');
                    upload(jobInfo);
                    if(index===browsers.length-1 && connect)
                        connect.stop(function(){ console.log('Tunnel destroyed');});
                });
            });
            }
        });
    });

};