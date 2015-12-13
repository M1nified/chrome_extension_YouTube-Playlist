$(document).ready(function(){
	prepareLoop();
	prepareLinkRunPlayer();
})
var prepareLoop = function(){
	chrome.storage.sync.get("loop",function(data){
		if(!data.loop && data.loop!==false){
			chrome.storage.sync.set({loop:false},function(){});
			data.loop = false;
		}
		if(data.loop === true){
			$("input#loop").attr("checked",true);
		}
	})
	$("#loop").on("change",function(e){
		chrome.storage.sync.set({loop:$(this).prop("checked")})
	})
}
var prepareLinkRunPlayer = function(){
	var link = chrome.extension.getURL("background/RunYouTubePlayer.html");
	$("#link-run-player").attr("href",link);
}