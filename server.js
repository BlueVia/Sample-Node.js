//
// The MIT license
//
// Copyright (C) 2011 by Bernhard Walter ( @bernhard42 )
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

//
// Version 27.09.2011
//

express		= require('express'),
OAuth		= require('./oauth').OAuth,
ejs			= require("ejs");

// CONFIG

var consumerKey	   = "xxxxxxxxxxxxxxxx";
var consumerSecret = "xxxxxxxxxxxx";
var callbackUrl = "http://localhost:3000/accesstoken";
var sandbox = "_Sandbox";

// SETUP SERVER

var app = express.createServer();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: "bluevia_node.js_test_8943569166" }));

app.set('view engine', 'ejs');
app.set('view options', { layout: false });

// HELPERS

function getOauth(req) {
	return new OAuth(req.session.oa._requestUrl, req.session.oa._accessUrl,
					 req.session.oa._consumerKey, req.session.oa._consumerSecret,
					 req.session.oa._version, req.session.oa._authorize_callback,
					 req.session.oa._signatureMethod);
}

// ROUTING

app.get('/',
	function(req, res) {
		if (!req.session.oauth_access_token) {
			res.redirect("/authorise");
		} else {
			res.redirect("/smsform");
		}
});

app.get('/authorise',
	function(req, res) {
		var getRequestTokenUrl	 = "https://api.bluevia.com/services/REST/Oauth/getRequestToken";
		var getAccessTokenUrl	 = "https://api.bluevia.com/services/REST/Oauth/getAccessToken";
		var userAuthorizationUrl = "https://connect.bluevia.com/en/authorise?oauth_token=";

		var oa = new OAuth(getRequestTokenUrl, getAccessTokenUrl, consumerKey, consumerSecret,
						   "1.0", callbackUrl, "HMAC-SHA1");

		oa.getOAuthRequestToken(
			function(error, oauth_token, oauth_token_secret, results) {
				if (error) {
					console.log(JSON.stringify(error));
				} else {
					// store the tokens in the session
					req.session.oa = oa;
					req.session.oauth_token = oauth_token;
					req.session.oauth_token_secret = oauth_token_secret;

					// redirect the user to authorize the token
					res.redirect(userAuthorizationUrl + oauth_token);
				}
			}
		)
	}
);

app.get('/accesstoken',
	function(req, res) {
		var oa = getOauth(req);

		oa.getOAuthAccessToken( req.session.oauth_token, req.session.oauth_token_secret, req.param('oauth_verifier'),
			function(error, oauth_access_token, oauth_access_token_secret, results2) {
				if (error) {
					console.log(JSON.stringify(error));
				} else {
					// store the access token in the session
					req.session.oauth_access_token = oauth_access_token;
					req.session.oauth_access_token_secret = oauth_access_token_secret;

					res.redirect("/smsform");
				}
			}
		);
	}
);

app.get('/smsform',
	function(req, res) {
		if (!req.session.oauth_access_token) {
			res.redirect("/authorise");
		} else {
			res.render('smsform', { title : 'SEND SMS' });
		}
	}
);

app.get('/sendsms',
	function(req, res) {
		var smsOutboundURL = "https://api.bluevia.com/services/REST/SMS" + sandbox 
		                     + "/outbound/requests?version=v1&alt=json";
		
		var oa = getOauth(req)
		var access_token		= req.session.oauth_access_token;
		var access_token_secret = req.session.oauth_access_token_secret;
		
		post_body = {"smsText": {
		  "address": [ {phoneNumber: req.param('mobilenumber')} ],
		  "message": req.param('message'),
		  "originAddress": {"alias": access_token }
		}}
		
		oa.post(smsOutboundURL, access_token, access_token_secret, 
			JSON.stringify(post_body), "application/json", 
			function(error, data, response) {
				if (error) {
					console.log(JSON.stringify(error));
				} else {
					res.render('track', {
						title : 'TRACK SMS',
						message_id : (response.headers["location"]).split("/")[8]
					});
				}
			}
		)
	}
);

app.get('/tracksms',
	function(req, res) {
		var smsTrackUrl = "https://api.bluevia.com/services/REST/SMS" + sandbox + "/outbound/requests/" 
						  + req.param('message_id') + "/deliverystatus?alt=json&version=v1";

		var oa = getOauth(req)
		var access_token		= req.session.oauth_access_token;
		var access_token_secret = req.session.oauth_access_token_secret;
		
		// oa.get(smsTrackUrl, access_token, access_token_secret,
		// To get json result, instead of oa.get use the private function of oauth
		oa._performSecureRequest( access_token, access_token_secret, 
			"GET", smsTrackUrl, null, "", "application/json",
			function(error, data, response) {
				if (error) {
					console.log(JSON.stringify(error));
				} else {
					var p = JSON.parse(data);
					var status = p.smsDeliveryStatus.smsDeliveryStatus[0].address.phoneNumber
					             + " => " + p.smsDeliveryStatus.smsDeliveryStatus[0].deliveryStatus;
					res.render('smsstatus', {
						title : 'SMS DELIVERY STATUS',
						status : status
					});
				}
			}
		)
	}
);

app.listen(3000);
console.log("listening on http://localhost:3000");