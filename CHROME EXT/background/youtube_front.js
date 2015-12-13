console.log('CHROME EXTENSION IS LIVE!')
YTPlayer_settings_loop = false;
function getVarsFrom(url)
{
	var vars = {};
	var hashes = url.slice(url.indexOf('?') + 1).split('&');
	console.log(hashes)
	for(var i = 0; i < hashes.length; i++)
	{
		var hash = hashes[i].split('=');
		if(hash && hash.length==2){
			vars[hash[0]] = hash[1].split('#')[0];
		}
	}
	return vars;
}
function getUrlVars()
{
	return getVarsFrom(window.location.href);
}
$(document).ready(function(){
	$("#autoplay-checkbox").attr("checked",false);
	$("#autoplay-checkbox-label").trigger( "click" );

	if(getUrlVars()["YTPlayer"] == 'true'){
		getSettings();
		appendPanel();
		runPlayer();
		fillPlaylist();
		runDocumentLocationMonitor();
		setStorageListeners();
	}else{
		$("body").append('<button title="Open dedicated extended player" href="http://www.prowebject.com/YTPlayer/private_player.html" style="background-image:url('+chrome.extension.getURL('img/player.png')+'); position:fixed; bottom: -1px; right:-1px;	outline: none;	border: none;	box-shadow: inset 0px 0px 3px #838383;	border-radius: 2px;	height: 40px;	font-size: 15px;	color: #5B5B5B;	padding: 10px 10px;	margin-left: 5px;	font-weight: bold;	cursor: pointer;	background-color: #8AC98E;	background-repeat: no-repeat;	background-size: 32px;	background-position: 6px 4px;	width: 44px;   z-index: 3;" onclick="window.open(\'http://www.prowebject.com/YTPlayer/private_player.html\');">&nbsp;</button>');
	}
});
var setStorageListeners = function(){
	chrome.storage.onChanged.addListener(function(changes,areaName){
		if(changes.playlist){
			fillPlaylist();
		}
		if(changes.loop){
			YTPlayer_settings_loop = changes.loop.newValue;
		}
	})
}
var getSettings = function(){
	chrome.storage.sync.get(["loop"],function(data){
		if(data){
			if(data.loop!==undefined){
				YTPlayer_settings_loop = data.loop;
			}
		}
	})
}
var document_location_monitor_value = document.location.href;
var documentLocationMonitor = function(){
	if(document_location_monitor_value !== document.location.href){
		setTimeout(fillPlaylist,2000);
		document_location_monitor_value = document.location.href;
	}
}
var runDocumentLocationMonitor = function(){
	document_location_monitor_value = document.location.href;
	setInterval(documentLocationMonitor,2000);
}
var videoProgressMonitor = function(){
	var progress = $($(".html5-scrubber-button")[0]).attr('style');
	progress = progress.split("origin: ")[1].split("%")[0];
	progress = parseInt(progress);
	//console.log(progress);
	if(progress >= 100){
		chrome.runtime.sendMessage({func:"playNextVideo",videoId:getUrlVars()['v']})
		clearInterval(videoProgressMonitorInterval);
	}
}
var runPlayer = function(){
	console.log("RUN")
	var player = $("#player-api")[0];
	videoProgressMonitorInterval = setInterval(videoProgressMonitor,1000);
}
var appendPanel = function(){
	$("#watch-related").parent().prepend('<div style="  margin-bottom: 15px;  font-weight: bold;  vertical-align: middle;  text-align: center;  color: #502C2C;">YouTube Playlist for Chrome</div>'+'<div style="margin-bottom:10px;"><button title="Play next" id="YTPlaylit_button-next" style="background-image: url('+chrome.extension.getURL('img/button_next.png')+');">&nbsp;</button><button title="Clear playlist" id="YTPlaylit_button-clear">Clear</button><button class="off" title="Loop playlist" id="YTPlaylit_button-loop" style="background-image: url('+chrome.extension.getURL('img/repeat.png')+');">&nbsp;</button><button href="'+chrome.extension.getURL('html/options.html')+'" id="YTPlaylit_button-options" title="Options" style="background-image:url('+chrome.extension.getURL('img/settings.png')+');">&nbsp;</button><button class="alink" id="YTPlaylist_button-private-player" title="Open dedicated extended player" href="http://www.prowebject.com/YTPlayer/private_player.html" style="background-image:url('+chrome.extension.getURL('img/player.png')+')">&nbsp;</button></div>'+'<form id="YTPlaylist_form-add-video" style="margin-left:5px;"><input type="url" id="YTPlaylist_add-video" placeholder="New video url..." style="outline: none;  border: none;  box-shadow: inset 0px 0px 3px #838383;  border-radius: 2px;  height: 30px;  margin-bottom: 20px;  font-size: 15px;  color: #5B5B5B;  padding: 5px 10px;  clear: both;" required><input type="submit" value="ADD"></form>');
	$("#YTPlaylit_button-options").on("click",function(event){
		chrome.runtime.sendMessage({func:"openOptionsPage"});
	})
	$(".alink").on("click",function(event){
		window.open($(this).attr("href"));
	})
	$("#YTPlaylit_button-next").on("click",function(){
		chrome.runtime.sendMessage({func:"playNextVideo",videoId:getUrlVars()['v']});
	})
	$("#YTPlaylit_button-clear").on("click",function(){
		chrome.storage.local.set({playlist:null},function(){});
	})
	$("#YTPlaylist_add-video").css('width',$("#YTPlaylist_add-video").parent().width()-88);
	$("#YTPlaylist_form-add-video").on("submit",function(event){
		event.preventDefault();
		var url = $("#YTPlaylist_add-video").val();
		var v = getVarsFrom(url)['v'];
		if(v){
			chrome.runtime.sendMessage({func:"addToPlaylist",videoId:v});
		}else if(/.*youtu\.be\/\w+/i.test(url)){
			v = /\w+$/i.exec(url)[0];
			chrome.runtime.sendMessage({func:"addToPlaylist",videoId:v});
		}
		this.reset();
	});
}
var fillPlaylist = function(){
	$("#watch-related").empty();
	chrome.storage.local.get({playlist:null},function(data){
		console.log(data)
		for(var i in data.playlist){
			var videoId = data.playlist[i].id;
			var videoTitle = data.playlist[i].snippet.title || '';
			var channelTitle = data.playlist[i].snippet.channelTitle || '';
			var videoDuration = '';
			$("#watch-related").append('<li class="video-list-item related-list-item">  <a href="/watch?v='+ videoId +'&YTPlayer=true" class=" related-video spf-link  yt-uix-sessionlink" data-sessionlink="feature=related&amp;ved=CAcQzRooAQ&amp;ei=q6gdVNSPMIz50gX7gIH4Ag"><span class="yt-uix-simple-thumb-wrap yt-uix-simple-thumb-related" data-vid="'+ videoId +'"><img alt="" data-thumb="//i.ytimg.com/vi/'+ videoId +'/default.jpg" aria-hidden="true" src="//i.ytimg.com/vi/'+ videoId +'/default.jpg" width="120" height="90" data-group-key="thumb-group-0"><span class="video-time">'+ videoDuration +'</span>  <span class="thumb-menu dark-overflow-action-menu video-actions"><button onclick=";return false;" class="yt-uix-button-reverse flip addto-watch-queue-menu spf-nolink hide-until-delayloaded yt-uix-button yt-uix-button-dark-overflow-action-menu yt-uix-button-size-default yt-uix-button-has-icon yt-uix-button-empty" type="button" role="button" aria-pressed="false" aria-expanded="false" aria-haspopup="true" aria-activedescendant=""><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="yt-uix-button-icon yt-uix-button-icon-dark-overflow-action-menu yt-sprite"></span><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="yt-uix-button-arrow yt-sprite"><ul class="watch-queue-thumb-menu yt-uix-button-menu yt-uix-button-menu-dark-overflow-action-menu" style="display: none;"><li role="menuitem"><span class="overflow-menu-choice addto-watch-queue-menu-choice yt-uix-button-menu-item" data-action="play-next" onclick=";return false;" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="addto-watch-queue-play-next-icon yt-valign-container yt-sprite"></span>Odtwórz jako następny</span></li><li role="menuitem"><span class="overflow-menu-choice addto-watch-queue-menu-choice yt-uix-button-menu-item" data-action="play-now" onclick=";return false;" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="addto-watch-queue-play-now-icon yt-valign-container yt-sprite"></span>Odtwórz teraz</span></li></ul></button></span><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-later-button yt-uix-tooltip" type="button" onclick=";return false;" title="Do obejrzenia" role="button" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" title="Do obejrzenia" class="yt-uix-button-icon yt-uix-button-icon-addto yt-sprite"></span></button><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon addto-button addto-queue-button video-actions spf-nolink hide-until-delayloaded addto-tv-queue-button yt-uix-tooltip" type="button" onclick=";return false;" title="Kolejka TV" data-style="tv-queue" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" title="Kolejka TV" class="yt-uix-button-icon yt-uix-button-icon-addto yt-sprite"></span></button></span>  <span dir="ltr" class="title" title="'+ videoTitle +'">'+ videoTitle +'</span><span class="stat attribution"><span class="g-hovercard" data-ytid="UCUMZybDJyqZYrj9eBx5DaSQ" data-name="related">autor: <span class=" g-hovercard" data-ytid="UCUMZybDJyqZYrj9eBx5DaSQ">'+ channelTitle +'</span></span></span><span class="stat view-count">&nbsp;</span></a></li>');
			if(videoId === getUrlVars()['v']){
				$("li.video-list-item.related-list-item").not(".autoplay-bar li").last().prepend('<div class="YTPlaylist_current" title="Current clip"><img src="'+ chrome.extension.getURL("img/play.png") +'"></div>');
			}
		}
		$("li.video-list-item.related-list-item").not(".autoplay-bar li").prepend('<div class="YTPlaylit_button YTPlaylist_buttonadd_vid" title="Remove!"><img src="'+ chrome.extension.getURL("img/trash.png") +'"></div>');
		$(".YTPlaylist_buttonadd_vid").not(".YTPlaylist_listenON").click(function(event){
			event.preventDefault();
			event.stopPropagation();
			console.log("REMOVE")
			var videoId = getVarsFrom($(".related-video.spf-link.yt-uix-sessionlink",$(this).parent()).attr("href"))['v'];
			chrome.runtime.sendMessage({func:"removeFromPlaylist",videoId:videoId});
		}).addClass("YTPlaylist_listenON");
	});
}




	/*var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			//console.log('style changed!');
			
		});    
});*/
	//observer.observe(timer,{ attributes : true, attributeFilter : ['style'] });