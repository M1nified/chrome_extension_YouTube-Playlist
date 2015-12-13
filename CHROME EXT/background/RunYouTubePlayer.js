chrome.runtime.getBackgroundPage(function(backgroundPage){
	console.log(backgroundPage)
	chrome.tabs.getCurrent(function(tab){
		backgroundPage.runPlayer0(tab);	
	})
})