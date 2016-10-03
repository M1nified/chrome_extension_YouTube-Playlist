// IFrame Player API

class YouTubePlayer{
	static get playerdivid(){return Settings.PLAYER_ID};
	static init(){
		YouTubePlayer.done = false; //indicates if player is ready
		return new Promise((resolve,reject)=>{
			if(typeof YT === 'undefined') reject("YouTubeIframeAPI is not ready!");
			YouTubePlayer.player = new YT.Player(YouTubePlayer.playerdivid, {
				height: '390',
				width: '640',
				videoId: 'M7lc1UVf-VE',
				events: {
					'onReady': (event)=>{resolve();},
					'onStateChange': YouTubePlayer.onPlayerStateChange
				}
			});
		})
	}
	static injectYouTubeIframeAPI(){
		return new Promise((resolve,reject)=>{
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			window.onYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady || function(){
				resolve();
			}
		})
	}
	static prepare(){
	}
	static onPlayerStateChange(event) {
		console.log(event);
		switch(event.data){
			case -1:
			Playlist.fillPlaylist();
			break;
			case 0:
			switch($("#YTPlaylit_button-loop").attr("state")){
				case "loop_single":
				YouTubePlayer.player.seekTo(0,true);
				break;
				default:
				YouTubePlayer.playNextVideo();
				break;
			}
			break;
		}
	}
	static playVideo(videoid){
		try{
			YouTubePlayer.player.loadVideoById({
			videoId : videoid
		});
		}catch(err){
			console.error("loadVideoById ERROR:",err);
		}
		if(YouTubePlayer.player){
			YouTubePlayer.player.playVideo();
		}else{
			console.warn("YouTubePlayer.player not ready yet.");
		}
		Playlist.fillPlaylist();
	}
	static stopVideo() {
		YouTubePlayer.player.stopVideo();
	}
	static playNextVideo(){
		console.warn("Not defined yet!");
	}
	static get videoId(){
		let videodata = YouTubePlayer.player.getVideoData();
		if(videodata) return videodata.video_id;
		return null;
	}
}

// Extension support

class Playlist{
	static init(playlistcontainerid){
		Playlist.container = document.getElementById(playlistcontainerid);
		Object.defineProperty(Playlist,"list",{
			get: function(){
				return Playlist._list;
			},
			set: function(val){
				Playlist._list = val;
				Playlist.fillPlaylist();
			}
		});
		Playlist.list = [];
	}
	static playNextVideo(){
		let videoId = YouTubePlayer.videoId;
		if(Playlist.list && Playlist.list.length > 0){
			let index = null;
			for(let i in Playlist.list){
				if(Playlist.list[i].tobeplayed === undefined || Playlist.list[i].tobeplayed === null || Playlist.list[i].tobeplayed === true){
					index = i;
					break;
				}
			}
			if(index === null){
				return;
			}
			index = null;
			for(let i in Playlist.list){
				if(Playlist.list[i].id == videoId){
					index = i;
					break;
				}
			}
			if(Playlist.list[0].id == videoId){
				index = 0;
			}
			let player_mode = $("#YTPlaylit_button-loop").attr("state");
			if(player_mode == "shuffle"){
				//make list of indexes of videos to use
				let list = [];
				for(let i=0;i<Playlist.list.length;i++){
					if(Playlist.list[i].tobeplayed !== false && i != index){
						list.push(i);
					}
				}
				if(list.length === 0){
					var newvideoId = Playlist.list[index].id;
				}else{
					let pick = Math.floor(Math.random() * list.length);
					var newvideoId = Playlist.list[list[pick]].id;
				}
			}else{
				do{
					if(index !== null){
						index++;
						if(index >= Playlist.list.length){
							if(player_mode=="play_once"){
								return;
							}
							index = 0;
						}
						var newvideoId = Playlist.list[index].id;
					}else{
						var newvideoId = Playlist.list[0].id;
					}
				}while(Playlist.list[index].tobeplayed === false)
			}
			YouTubePlayer.playVideo(newvideoId);
			Playlist.fillPlaylist();
		}
	}
	static fillPlaylist(playlist){
		playlist = (playlist!=undefined) ? playlist : Playlist.list;
		console.log(playlist);
		var current = YouTubePlayer.videoId;
		console.log("Current:",current);
		$(Playlist.container).empty();
		for(var i in playlist){
			var videoId = playlist[i].id;
			var videoTitle = playlist[i].snippet.title || '';
			var channelTitle = playlist[i].snippet.channelTitle || '';
			var toBePlayed = playlist[i].tobeplayed;
			var checked = toBePlayed === undefined || toBePlayed === null || toBePlayed === true? 'checked' : '';
			var videoDuration = '';
			$(Playlist.container).append('<li class="video-list-item related-list-item" draggable="true" video_id="'+videoId+'"> <div class="YTPlaylit_button-remove" title="Remove!" video_id="'+ videoId+'"><img src="img/trash.png"></div>'+

			'<div class="YTPlaylit_checkbox_state" title="Play or not?"><input type="checkbox" data-video_id="'+videoId+'" '+checked+' ></div>'

			+'<a data-videoid="'+videoId+'" class="YTPlaylist_playlink related-video spf-link  yt-uix-sessionlink" data-sessionlink="feature=related&amp;ved=CAcQzRooAQ&amp;ei=q6gdVNSPMIz50gX7gIH4Ag"><span class="yt-uix-simple-thumb-wrap yt-uix-simple-thumb-related" data-vid="'+ videoId +'"><img alt="" data-thumb="//i.ytimg.com/vi/'+ videoId +'/default.jpg" aria-hidden="true" src="//i.ytimg.com/vi/'+ videoId +'/default.jpg" width="120" height="90" data-group-key="thumb-group-0" class="YTPlayer_video-image"><span class="video-time">'+ videoDuration +'</span>  <span class="thumb-menu dark-overflow-action-menu video-actions"><button onclick=";return false;" class="yt-uix-button-reverse flip addto-watch-queue-menu spf-nolink hide-until-delayloaded yt-uix-button yt-uix-button-dark-overflow-action-menu yt-uix-button-size-default yt-uix-button-has-icon yt-uix-button-empty" type="button" role="button" aria-pressed="false" aria-expanded="false" aria-haspopup="true" aria-activedescendant=""><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="yt-uix-button-icon yt-uix-button-icon-dark-overflow-action-menu yt-sprite"></span><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="yt-uix-button-arrow yt-sprite"><ul class="watch-queue-thumb-menu yt-uix-button-menu yt-uix-button-menu-dark-overflow-action-menu" style="display: none;"><li role="menuitem"><span class="overflow-menu-choice addto-watch-queue-menu-choice yt-uix-button-menu-item" data-action="play-next" onclick=";return false;" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="addto-watch-queue-play-next-icon yt-valign-container yt-sprite"></span>Odtwórz jako następny</span></li><li role="menuitem"><span class="overflow-menu-choice addto-watch-queue-menu-choice yt-uix-button-menu-item" data-action="play-now" onclick=";return false;" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" class="addto-watch-queue-play-now-icon yt-valign-container yt-sprite"></span>Odtwórz teraz</span></li></ul></button></span><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-later-button yt-uix-tooltip" type="button" onclick=";return false;" title="Do obejrzenia" role="button" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" title="Do obejrzenia" class="yt-uix-button-icon yt-uix-button-icon-addto yt-sprite"></span></button><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon addto-button addto-queue-button video-actions spf-nolink hide-until-delayloaded addto-tv-queue-button yt-uix-tooltip" type="button" onclick=";return false;" title="Kolejka TV" data-style="tv-queue" data-video-ids="'+ videoId +'"><span class="yt-uix-button-icon-wrapper"><img src="https://s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif" title="Kolejka TV" class="yt-uix-button-icon yt-uix-button-icon-addto yt-sprite"></span></button></span>  <span dir="ltr" class="title" title="'+ videoTitle +'">'+ videoTitle +'</span><span class="stat attribution"><span class="g-hovercard" data-ytid="UCUMZybDJyqZYrj9eBx5DaSQ" data-name="related">autor: <span class=" g-hovercard" data-ytid="UCUMZybDJyqZYrj9eBx5DaSQ">'+ channelTitle +'</span></span></span><span class="stat view-count">&nbsp;</span></a></li>');
			if(videoId === current){
				$("li.video-list-item.related-list-item").not(".autoplay-bar li").last().prepend('<div class="YTPlaylist_current" title="Current clip"><img src="img/play.png"></div>');
			}
		}
		$(Playlist.container).sortable({
			update: function( event, ui ) {
				//console.log(ui);
				//console.log($("#playlist>li").not(".ui-sortable-placehoder").toArray())
				//console.log($(ui.item).toArray()[0]);
				var li = $(ui.item).toArray()[0];
				var newposition = $(">li",Playlist.container).not(".ui-sortable-placehoder").toArray().indexOf(li);
				console.log(newposition);
				var videoId = $(li).children(".YTPlaylit_button-remove").attr("video_id");
				console.log(videoId)
				if(ChromeExt){
					ChromeExt.postMessage({moveVideo:true,videoId:videoId,newposition:newposition});
				}
			}
		});
		$(".YTPlaylist_playlink").on("click",function(evt){
			console.log(evt)
			if(YouTubePlayer){
				YouTubePlayer.playVideo($(evt.currentTarget).data("videoid"));
				console.log(YouTubePlayer.player.getVideoUrl());
			}
		})
		$(".YTPlaylit_button-remove").on("click",function(evt){
			if(ChromeExt){
				ChromeExt.postMessage({removeVideo:true,videoId:$(evt.currentTarget).attr("video_id")})
			}
		})
		$(".YTPlaylit_checkbox_state>input").on("change",function(evt){
			if(ChromeExt){
				ChromeExt.postMessage({changeToBePlayedState:true,videoId:$(evt.currentTarget).data("video_id"),state:Playlist.checked});
			}
		})
	}
}