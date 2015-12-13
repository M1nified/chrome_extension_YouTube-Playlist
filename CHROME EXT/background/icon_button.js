var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-18744559-7']);
_gaq.push(['_trackPageview']);
_gaq.push(['_trackEvent', 'icon_button.js', 'load']);
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

chrome.browserAction.onClicked.addListener(function(){iconOnClicked();});
function iconOnClicked(){
	_gaq.push(['_trackEvent', 'chrome.browserAction', 'onClicked']);
}	