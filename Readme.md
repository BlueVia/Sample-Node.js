Keywords:			MultiMarkdown, Markdown, XML, XHTML, XSLT, PDF   
CSS:				css/print.css
CSS:  				css/doc-less.css



Feel free to download and mess around with this app, it may or may not be updated regularly, when it is we will publicise on our twitter feed (@BlueVia)


## Get your Node.js environment prepared

The sample has been tested with Node.js v0.6.6.
It needs 7 node modules that can be installed with 'npm':

- qs
- mime
- connect
- mkdirp
- express
- oauth
- ejs

## Setup and personal settings

At the beginning of 'server.js' 4 variables have to be adapted

        // CONFIG

        var consumerKey	   = "xxxxxxxxxxxxxxxx";
        var consumerSecret = "xxxxxxxxxxxx";
        var callbackUrl = "http://localhost:3000/accesstoken";
        var sandbox = "_Sandbox";

Add your BlueVia consumer credentials, check whether you keep on using port 3000 and change "_Sandbox" to "" if you want to test against the real mobile network

## Start the server and use it ##

Go to the terminal and call

        node server.js
        
and then browse to http://localhost:3000 if yopu haven't changed the port. It immediately will start with the authorization steps at BlueVia.


