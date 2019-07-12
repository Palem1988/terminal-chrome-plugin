/**
 * Switches the plugin on
 */
function _on () {
	console.log('plugin is switched on')

	// set icon
	chrome.browserAction.setIcon({ path: 'on.png' });
}


/* On install */
chrome.runtime.onInstalled.addListener(function(){
	// chrome.browserAction.onClicked.addListener(toggle);
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