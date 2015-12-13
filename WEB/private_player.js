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
EXTPORT = null;
PLAYLIST = null;
extensionID = "kjakkfkngikelijjclgkplmiclokfmfi";//kjakkfkngikelijjclgkplmiclokfmfi
function onYouTubePlayerReady(playerId) {
	console.log("PLAYER READY")
	ytplayer = document.getElementById("ytplayer");
	//ytplayer.clearVideo();
	setPlayer();
	ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
}
$(document).ready(function(){
	loadingStart();
	var params = { allowScriptAccess: "always",allowFullScreen:true,wmode:"opaque"};
	var atts = { id: "ytplayer" };
	swfobject.embedSWF("http://www.youtube.com/v/UqLRqzTp6Rk?enablejsapi=1&playerapiid=ytplayer&version=3",
		"ytapiplayer", "640", "390", "8", null, null, params, atts);

	setResizer();
	$("#YTPlaylit_button-options").on("click",function(event){
		chrome.runtime.sendMessage({func:"openOptionsPage"});
	})
	$("#YTPlaylit_button-next").on("click",function(){
		playNextVideo();
	})

	$("#YTPlaylist_search").on("keyup",function(){
		$("#playlist>li").css("display","list-item");
		var search = $(this).val();
		if(search && search !== ""){
			var patt = new RegExp(".*"+search+".*","igm");
			for(i in PLAYLIST){
				if(!patt.test(PLAYLIST[i].snippet.channelTitle) && !patt.test(PLAYLIST[i].snippet.title)){
					$("#playlist>li[video_id="+PLAYLIST[i].id+"]").css("display","none");
				}
			}
		}
	})
})
var loadingStart = function(){
	$("#loading").css("display","block");
}
var loadingEnd = function(){
	$("#loading").css("display","none");
}
var setResizer = function(){
	resizeinprogressevent = null;
	$("#resizerbar").on("mousedown",function(event){
		resizeinprogressevent=event;
	})
	$(document).on("mousemove",function(event){
		if(resizeinprogressevent && event.clientX>=0 && event.clientX<=$(window).width()){
			var newwidth = $("#ytplayer").width()+(event.clientX-resizeinprogressevent.clientX);
			if(newwidth<640){
				newwidth=640;
			}else if(newwidth>$(window).width()-40){
				newwidth=$(window).width()-40;
			}
			$("#resizerbar").css('height',newwidth*390/640 + 'px');
			$("#ytplayer").css('width',newwidth+'px').css('height',newwidth*390/640 + 'px');
			resizeinprogressevent=event;	
		}else{
			resizeinprogressevent=null;
		}
		
	}).on("mouseup",function(event){
		resizeinprogressevent = null;
	})
}
var setPlayer = function(){
	var extport = chrome.runtime.connect(extensionID);
	EXTPORT = extport;
	console.log(extport);
	extport.postMessage({test:7357});
	extport.postMessage({getPlaylist:true});
	extport.onDisconnect.addListener(function(){
		EXTPORT = null;
	})
	extport.onMessage.addListener(function(msg) {
		console.log(msg)
		if (msg.available !== undefined){
			console.log("CONNECTED TO EXTENSION");
			loadingEnd();
		}else if (msg.type == "playlist"){
			PLAYLIST = msg.data;
			/*var list = [];
			for(i in msg.data){
				list.push(msg.data[i].id);
			}*/
			if(msg.data && msg.data.length > 0){
				playVideo(msg.data[0].id);
			}
			//ytplayer.playVideo();
		}else if(msg.type == "playlist_update"){
			PLAYLIST = msg.data;
			fillPlaylist(msg.data);
		}
	});
	$(document).ready(function(){
		$("#YTPlaylit_button-clear").on("click",function(){
			extport.postMessage({clearPlaylist:true});
		})
		$("#YTPlaylist_form-add-video").on("submit",function(event){
			event.preventDefault();
			var url = $("#YTPlaylist_add-video").val();
			var v = getVarsFrom(url)['v'];
			if(v){
				extport.postMessage({addToPlaylist:true,videoId:v});
			}else if(/.*youtu\.be\/\w+/i.test(url)){
				v = /\w+$/i.exec(url)[0];
				extport.postMessage({addToPlaylist:true,videoId:v});
			}
			this.reset();
		});
		$("#YTPlaylit_button-loop").on("click",function(event){
			switch($(this).attr("state")){
				case "play_once":
				$(this).attr("state","loop_all").css("background-image","url(img/repeat.png)");
				break;
				case "loop_all":
				$(this).attr("state","loop_single").css("background-image","url(img/repeat_single.png)");
				break;
				default:
				$(this).attr("state","play_once").css("background-image","url(img/button_arrow.png)");
				break;
			}
		})
	})
}
var onytplayerStateChange = function(new_state){
	console.log(new_state)
	switch(new_state){
		case 0:
		switch($("#YTPlaylit_button-loop").attr("state")){
			case "loop_single":
			ytplayer.seekTo(0,true);
			break;
			default:
			playNextVideo();
			break;
		}
		break;
	}
}
var fillPlaylist = function(playlist){
	playlist = (playlist!=undefined) ? playlist : PLAYLIST;
	console.log(playlist);
	var current = ytplayer.getVideoUrl();
	console.log(current)
	current = getVarsFrom(current)['v'];
	console.log(current)
	$("#playlist").empty();
	for(var i in playlist){
		var videoId = playlist[i].id;
		var videoTitle = playlist[i].snippet.title || '';
		var channelTitle = playlist[i].snippet.channelTitle || '';
		var toBePlayed = playlist[i].tobeplayed;
		var checked = toBePlayed === undefined || toBePlayed === null || toBePlayed === true? 'checked' : '';
		var videoDuration = '';
		$("#playlist").append('<li class="video-list-item related-list-item" draggable="true" video_id="'+videoId+'"> <div class="YTPlaylit_button-remove" title="Remove!" video_id="'+ videoId+'"><img src="img/trash.png"></div>'+
		
		'<div class="YTPlaylit_checkbox_state" title="Play or not?"><input type="checkbox" data-video_id="'+videoId+'" '+checked+' ></div>'
		
		+'<a href="javascript:playVideo(\''+ videoId +'\');" class=" related-video spf-link  yt-uix-sessionlink" data-sessionlink="feature=related&amp;ved=CAcQzRooAQ&amp;ei=q6gdVNSPMIz50gX7gIH4Ag"><span class="yt-uix-simple-thumb-wrap yt-uix-simple-thumb-related" data-vid="'+ videoId +'"><img alt="" data-thumb="//i.ytimg.com/vi/'+ videoId +'/default.jpg" aria-hidden="true" src="//i.ytimg.com/vi/'+ videoId +'/default.jpg" width="120" height="90" data-group-key="thumb-group-0" class="YTPlayer_video-image"><span class="video-time">'+ videoDuration +'</span>  <span class="thumb-menu dark-overflow-action-menu video-actions"><button onclick=";return false;" class="yt-uix-button-reverse flip addto-watch-queue-menu spf-nolink hide-until-delayloaded yt-uix-button yt-uix-button-dark-overflow-action-menu yt-uix-button-size-default yt-uix-button-has-icon yt-uix-button-empty" type="button" role="button" aria-pressed="false" aria-expanded="false" aria-haspopup="true" aria-activedescendant=""><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="yt-uix-button-icon yt-uix-button-icon-dark-overflow-action-menu yt-sprite"></span><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="yt-uix-button-arrow yt-sprite"><ul class="watch-queue-thumb-menu yt-uix-button-menu yt-uix-button-menu-dark-overflow-action-menu" style="display: none;"><li role="menuitem"><span class="overflow-menu-choice addto-watch-queue-menu-choice yt-uix-button-menu-item" data-action="play-next" onclick=";return false;" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="addto-watch-queue-play-next-icon yt-valign-container yt-sprite"></span>Odtwórz jako następny</span></li><li role="menuitem"><span class="overflow-menu-choice addto-watch-queue-menu-choice yt-uix-button-menu-item" data-action="play-now" onclick=";return false;" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="addto-watch-queue-play-now-icon yt-valign-container yt-sprite"></span>Odtwórz teraz</span></li></ul></button></span><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-later-button yt-uix-tooltip" type="button" onclick=";return false;" title="Do obejrzenia" role="button" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" title="Do obejrzenia" class="yt-uix-button-icon yt-uix-button-icon-addto yt-sprite"></span></button><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon addto-button addto-queue-button video-actions spf-nolink hide-until-delayloaded addto-tv-queue-button yt-uix-tooltip" type="button" onclick=";return false;" title="Kolejka TV" data-style="tv-queue" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" title="Kolejka TV" class="yt-uix-button-icon yt-uix-button-icon-addto yt-sprite"></span></button></span>  <span dir="ltr" class="title" title="'+ videoTitle +'">'+ videoTitle +'</span><span class="stat attribution"><span class="g-hovercard" data-ytid="UCUMZybDJyqZYrj9eBx5DaSQ" data-name="related">autor: <span class=" g-hovercard" data-ytid="UCUMZybDJyqZYrj9eBx5DaSQ">'+ channelTitle +'</span></span></span><span class="stat view-count">&nbsp;</span></a></li>');
		if(videoId === current){
			$("li.video-list-item.related-list-item").not(".autoplay-bar li").last().prepend('<div class="YTPlaylist_current" title="Current clip"><img src="img/play.png"></div>');
		}
	}
	$("#playlist").sortable({
		update: function( event, ui ) {
			//console.log(ui);
			//console.log($("#playlist>li").not(".ui-sortable-placehoder").toArray())
			//console.log($(ui.item).toArray()[0]);
			var li = $(ui.item).toArray()[0];
			var newposition = $("#playlist>li").not(".ui-sortable-placehoder").toArray().indexOf(li);
			console.log(newposition);
			var videoId = $(li).children(".YTPlaylit_button-remove").attr("video_id");
			console.log(videoId)
			if(EXTPORT){
				EXTPORT.postMessage({moveVideo:true,videoId:videoId,newposition:newposition});
			}
		}
	});
	$(".YTPlaylit_button-remove").on("click",function(){
		if(EXTPORT){
			EXTPORT.postMessage({removeVideo:true,videoId:$(this).attr("video_id")})
		}
	})
	$(".YTPlaylit_checkbox_state>input").on("change",function(){
		var el = this;
		if(EXTPORT){
			EXTPORT.postMessage({changeToBePlayedState:true,videoId:$(this).data("video_id"),state:this.checked});
		}
	})
}
var playNextVideo = function(){
	var videoId = ytplayer.getVideoUrl();
	videoId = getVarsFrom(videoId)['v'];
	if(PLAYLIST && PLAYLIST.length > 0){
		var index = null;
		for(i in PLAYLIST){
			if(PLAYLIST[i].tobeplayed === undefined || PLAYLIST[i].tobeplayed === null || PLAYLIST[i].tobeplayed === true){
				index = i;
				break;
			}
		}
		if(index === null){
			return;
		}
		index = null;
		for(i in PLAYLIST){
			if(PLAYLIST[i].id == videoId){
				index = i;
				break;
			}
		}
		if(PLAYLIST[0].id == videoId){
			index = 0;
		}
		do{
			if(index !== null){
				index++;
				if(index >= PLAYLIST.length){
					if($("#YTPlaylit_button-loop").attr("state")=="play_once"){
						return;
					}
					index = 0;
				}
				newvideoId = PLAYLIST[index].id;
			}else{
				newvideoId = PLAYLIST[0].id;
			}
		}while(PLAYLIST[index].tobeplayed === false)
		playVideo(newvideoId);
	}
}
var playVideo = function(videoId){
	ytplayer.loadVideoById(videoId,0);
	ytplayer.playVideo();
	fillPlaylist();
}