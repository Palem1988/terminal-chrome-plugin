const allowedOrigins = [
	'https://terminal-test.cryptocontrol.io',
	'https://terminal.cryptocontrol.io',
	'http://localhost:3000'
]


/**
 * Modifies the resposne to include the CORS headersr
 */
const responseListener = function (details) {
	// iff the request is originating from the terminal
	if (allowedOrigins.indexOf(details.initiator) === -1) return { };

	// add the CORS headers
	_replaceOrInsert(details.responseHeaders, 'Access-Control-Allow-Origin', '*');
	_replaceOrInsert(details.responseHeaders, 'Access-Control-Allow-Headers', '*');
	_replaceOrInsert(details.responseHeaders, 'Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');

	return { responseHeaders: details.responseHeaders };
};


/**
 * Toggles the plugin on or off
 */
function toggle () {
	chrome.storage.local.get({ active: true }, function (result) {
		if (result.active) _off()
		else _on()
	});
}


/**
 * Switches the plugin on
 */
function _on () {
	console.log('plugin is switched on')

	// set flag
	chrome.storage.local.set({ active: true });

	// remove & add listeners
	if (chrome.webRequest.onHeadersReceived.hasListener(responseListener)) {
        chrome.webRequest.onHeadersReceived.removeListener(responseListener)
    }
	chrome.webRequest.onHeadersReceived.addListener(responseListener, { urls: ['<all_urls>'] }, ['blocking', 'responseHeaders', 'extraHeaders']);

	// set icon
	chrome.browserAction.setIcon({ path: 'on.png' });
}


/**
 * Switches the plugin off
 */
function _off () {
	console.log('plugin is switched off')

	// set flag
	chrome.storage.local.set({ active: false });

	// remove listners
    if (chrome.webRequest.onHeadersReceived.hasListener(responseListener)) {
        chrome.webRequest.onHeadersReceived.removeListener(responseListener)
    }

	// set icon
	chrome.browserAction.setIcon({ path: 'off.png' });

	chrome.webRequest.handlerBehaviorChanged();
}


function _replaceOrInsert (array, key, value) {
	const index = array.findIndex(function (item) { return item.name === key })
	if (index >= 0) array[index].value = value;
	else array.push({ name: key, value: value });
}


/* On install */
chrome.runtime.onInstalled.addListener(function(){
	chrome.browserAction.onClicked.addListener(toggle);
	_on(); // enable the plugin by default

	// // Error handler
	// chrome.webRequest.onErrorOccurred.addListener(
    //     function (info){ console.log('CCIO was unable to modify headers for: '+info.url +' - '+info.error) },
    //     { urls: ['<all_urls>'] }
    // );
});


chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
	if (request) {
		if (request.message) {
			if (request.message == "version") {
				sendResponse({version: '1.0'});
			}
		}
	}
	return true;
	}
);


function messagePageScript() {
  window.postMessage({
    direction: 'from-content-script',
    message: 'Message from the content script'
  }, "*");
  console.log('extension message')
};
messagePageScript();
