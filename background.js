const allowedOrigins = [
	'https://terminal-test.cryptocontrol.io',
	'https://terminal.cryptocontrol.io',
	'http://localhost:3000',
	'https://cryptocontrol.io',
	'chrome-extension://'
]


function _replaceOrInsert (array, key, value) {
	const index = array.findIndex(function (item) { return item.name.toLowerCase() === key.toLowerCase() })
	if (index >= 0) array[index].value = value;
	else array.push({ name: key, value: value });
}


function _remove (array, key) {
	const index = array.findIndex(function (item) { return item.name.toLowerCase() === key.toLowerCase() })
	if (index >= 0) array.splice(index, 1);
}


function responseHeadersListener (details) {
	// iff the request is originating from the terminal
	if (allowedOrigins.indexOf(details.initiator) === -1) return { };
	// console.log(details.initiator, details.url)

	// remove the iframe header
	_remove(details.responseHeaders, 'x-frame-options');

	// add cors headers
	_replaceOrInsert(details.responseHeaders, 'access-control-allow-origin', details.initiator);
	_replaceOrInsert(details.responseHeaders, 'access-control-request-method', 'GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH');
	_replaceOrInsert(details.responseHeaders, 'access-control-request-headers', '*');
	_replaceOrInsert(details.responseHeaders, 'X-Content-Type-Options', 'nosniff');

	return { responseHeaders: details.responseHeaders };
};


/* On install */
chrome.runtime.onInstalled.addListener(function(){
	// Add response interceptor to modify requests
	chrome.webRequest.onHeadersReceived.addListener(
		responseHeadersListener,
		{ urls: ['<all_urls>'] },
		['blocking', 'responseHeaders', 'extraHeaders']
	);

	/**
	 * Handle messages coming in from the terminal
	 *
	 * from https://stackoverflow.com/questions/55214828/how-to-stop-corb-from-blocking-requests-to-data-resources-that-respond-with-cors
	 * and https://developer.chrome.com/apps/messaging
	 * and https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
	 */
	chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
		if (request == 'version') return sendResponse(true);

		const options = request.options || {}
		// options.mode = 'no-cors'

		fetch(request.url, options).then(function (response) {
			return response.text().then(function (text) {
				const result = {
					body: text,
					status: response.status,
					statusText: response.statusText
				};

				sendResponse([result, null]);
		});
		}, function (error) { sendResponse([null, error]); });

		// Will respond asynchronously.
		return true;
	});
});