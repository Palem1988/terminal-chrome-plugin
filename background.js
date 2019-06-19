var accessControlRequestHeaders;
var exposedHeaders;

var requestListener = function(details){
	var flag = false,
		rule = {
			name: "Origin",
			value: "http://terminal-test.cryptocontrol.io/*"
		};
	var i;

	console.log('req', details)

	for (i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
			flag = true;
			details.requestHeaders[i].value = rule.value;
			break;
		}
	}
	if(!flag) details.requestHeaders.push(rule);

	for (i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name.toLowerCase() === "access-control-request-headers") {
			accessControlRequestHeaders = details.requestHeaders[i].value
		}
	}

	return { requestHeaders: details.requestHeaders };
};


var responseListener = function(details){
	var flag = false,
	rule = {
			"name": "Access-Control-Allow-Origin",
			"value": "*"
		};

	console.log('res', details)

	for (var i = 0; i < details.responseHeaders.length; ++i) {
		if (details.responseHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
			flag = true;
			details.responseHeaders[i].value = rule.value;
			break;
		}
	}
	if(!flag) details.responseHeaders.push(rule);

	if (accessControlRequestHeaders) {
		details.responseHeaders.push({"name": "Access-Control-Allow-Headers", "value": accessControlRequestHeaders});
	}

	if(exposedHeaders) {
		details.responseHeaders.push({"name": "Access-Control-Expose-Headers", "value": exposedHeaders});
	}

	details.responseHeaders.push({"name": "Access-Control-Allow-Methods", "value": "GET, PUT, POST, DELETE, HEAD, OPTIONS"});

	return { responseHeaders: details.responseHeaders };
};

/* On install */
chrome.runtime.onInstalled.addListener(function(){
	chrome.storage.local.set({ active: true });
	chrome.storage.local.set({ urls: ["<all_urls>"] });
	chrome.storage.local.set({ exposedHeaders: '' });

	chrome.browserAction.onClicked.addListener(function(tab) {
		toggle()
	});

	on();
});


function toggle () {
	chrome.storage.local.get({ active: true }, function (result) {
		if (result.active) off()
		else on()
	});
}


function on () {
	chrome.storage.local.set({ active: true });

	// Remove Listeners
	chrome.webRequest.onHeadersReceived.removeListener(responseListener);
	chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

	chrome.browserAction.setIcon({ path: "on.png" });

	// Add Listeners
	chrome.webRequest.onHeadersReceived
		.addListener(responseListener, { urls: ["<all_urls>"] }, ["blocking", "responseHeaders"]);

	chrome.webRequest.onBeforeSendHeaders
		.addListener(requestListener,  { urls: ["<all_urls>"] },["blocking", "requestHeaders"]);
}


function off () {
	chrome.storage.local.set({ active: false });

	// remove listners
	chrome.webRequest.onHeadersReceived.removeListener(responseListener);
	chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

	// set icon
	chrome.browserAction.setIcon({ path: "off.png" });
}