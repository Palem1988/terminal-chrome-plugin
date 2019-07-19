const allowedOrigins = [
	'https://terminal-test.cryptocontrol.io',
	'https://terminal.cryptocontrol.io',
	'http://localhost:3000'
]


function _replaceOrInsert (array, key, value) {
	const index = array.findIndex(function (item) { return item.name.toLowerCase() === key.toLowerCase() })
	if (index >= 0) array[index].value = value;
	else array.push({ name: key, value: value });
}


function responseHeadersListener (details) {
	// iff the request is originating from the terminal
	if (allowedOrigins.indexOf(details.initiator) === -1) return { };

	// remove the iframe header
	_replaceOrInsert(details.responseHeaders, 'x-frame-options', '*');
	return { responseHeaders: details.responseHeaders };
};

/**
 * Switches the plugin on
 */
function _on () {
	console.log('plugin is switched on')

	chrome.webRequest.onHeadersReceived.addListener(responseHeadersListener,
		{ urls: ['<all_urls>'] }, ['blocking', 'responseHeaders', 'extraHeaders']
	);

	// set icon
	chrome.browserAction.setIcon({ path: 'on.png' });
}


/* On install */
chrome.runtime.onInstalled.addListener(function(){
	_on(); // enable the plugin by default
});


/**
 * Handle messages coming in from the terminal
 *
 * from https://stackoverflow.com/questions/55214828/how-to-stop-corb-from-blocking-requests-to-data-resources-that-respond-with-cors
 * and https://developer.chrome.com/apps/messaging
 */
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
