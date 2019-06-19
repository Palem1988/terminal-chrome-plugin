const allowedOrigins = [
	'https://terminal-test.cryptocontrol.io',
	'https://terminal.cryptocontrol.io',
]


/**
 * Modifies the resposne to include the CORS headersr
 */
const responseListener = function (details) {
	// iff the request is originating from the terminal
	if (allowedOrigins.indexOf(details.initiator) === -1) return
	console.log('res', details)

	// add the CORS headers
	details.responseHeaders.push({ name: 'Access-Control-Allow-Headers', value: '*' });
	details.responseHeaders.push({ name: 'Access-Control-Allow-Methods', value: 'GET, PUT, POST, DELETE, HEAD, OPTIONS' })

	return { responseHeaders: details.responseHeaders };
};


/**
 * Toggles the plugin on or off
 */
function toggle () {
	chrome.storage.local.get({ active: true }, function (result) {
		if (result.active) off()
		else on()
	});
}


/**
 * Switches the plugin on
 */
function on () {
	// set flag
	chrome.storage.local.set({ active: true });

	// remove & add listeners
	chrome.webRequest.onHeadersReceived.removeListener(responseListener);
	chrome.webRequest.onHeadersReceived.addListener(responseListener, { urls: ['<all_urls>'] }, ['blocking', 'responseHeaders']);

	// set icon
	chrome.browserAction.setIcon({ path: 'on.png' });
}


/**
 * Switches the plugin off
 */
function off () {
	// set flag
	chrome.storage.local.set({ active: false });

	// remove listners
	chrome.webRequest.onHeadersReceived.removeListener(responseListener);

	// set icon
	chrome.browserAction.setIcon({ path: 'off.png' });
}


/* On install */
chrome.runtime.onInstalled.addListener(function(){
	chrome.browserAction.onClicked.addListener(toggle);
	on(); // enable the plugin by default
});