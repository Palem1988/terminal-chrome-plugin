const allowedOrigins = [
	'https://terminal-test.cryptocontrol.io',
	'https://terminal.cryptocontrol.io',
	'http://localhost:3000'
]


/**
 * Modifies the resposne to include the CORS headersr
 */
function responseHeadersListener (details) {
	// iff the request is originating from the terminal
	if (allowedOrigins.indexOf(details.initiator) === -1) return { };
	// console.log('intercepting', details.url)

	// add the CORS headers
	// _remove(details.responseHeaders, 'Access-Control-Allow-Headers');
	_replaceOrInsert(details.responseHeaders, 'Access-Control-Allow-Headers', '*');
	_replaceOrInsert(details.responseHeaders, 'Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
	_replaceOrInsert(details.responseHeaders, 'Access-Control-Allow-Origin', details.initiator);

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

	// add listeners
    chrome.webRequest.onHeadersReceived.addListener(responseHeadersListener, { urls: ['<all_urls>'] }, ['blocking', 'responseHeaders', 'extraHeaders']);

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
	chrome.webRequest.onHeadersReceived.removeListener(responseHeadersListener)

	// set icon
	chrome.browserAction.setIcon({ path: 'off.png' });

	chrome.webRequest.handlerBehaviorChanged();
}


function _replaceOrInsert (array, key, value) {
	const index = array.findIndex(function (item) { return item.name.toLowerCase() === key.toLowerCase() })
	if (index >= 0) array[index].value = value;
	else array.push({ name: key, value: value });
}


function _remove (array, key) {
	const index = array.findIndex(function (item) { return item.name.toLowerCase() === key.toLowerCase() })
	if (index >= 0) array.splice(index, 1)
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


// from https://stackoverflow.com/questions/55214828/how-to-stop-corb-from-blocking-requests-to-data-resources-that-respond-with-cors
// and https://developer.chrome.com/apps/messaging
chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
	if (request == 'version') return sendResponse(true)

	fetch(request.url, request.options).then(function (response) {
	  	return response.text().then(function (text) {
			const result = {
				body: text,
				status: response.status,
				statusText: response.statusText
			};

			sendResponse([result, null]);
	  	});
	}, function (error) { sendResponse([null, error]); });

	return true;
});