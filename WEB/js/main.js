// Settings

var Settings = {
	EXTENSION_ID : "kjakkfkngikelijjclgkplmiclokfmfi",//kjakkfkngikelijjclgkplmiclokfmfi
	PLAYER_ID : "ytplayer"
}

// Run

$(function(){
	YouTubePlayer.injectYouTubeIframeAPI().then(()=>{
		YouTubePlayer.init().then(()=>{
			ChromeExt.connect().then(()=>{
				Playlist.init("playlist");
				enableButtons();
				setResizer();

			})
		})
	})

	// YouTubePlayer.injectYouTubeIframeAPI().then(()=>{
	// 	window.player1 = new YouTubePlayer(Settings.PLAYER_ID);
	// 	player1.prepare().then(()=>{
	// 		window.playlist1 = new Playlist("playlist");
	// 		window.ChromeExt = new ChromeExt(Settings.EXTENSION_ID);
	// 		ChromeExt.connect().then(()=>{
	// 			playlist1.ChromeExt = ChromeExt;
	// 		})
	// 	});
	// });
});

// Layout
var enableButtons = function(){
	$("#YTPlaylit_button-clear").on("click",function(){
		ChromeExt.postMessage({clearPlaylist:true});
	})
	$("#YTPlaylist_form-add-video").on("submit",function(event){
		event.preventDefault();
		var url = $("#YTPlaylist_add-video").val();
		var v = getVarsFrom(url)['v'];
		if(v){
			ChromeExt.postMessage({addToPlaylist:true,videoId:v});
		}else if(/.*youtu\.be\/\w+/i.test(url)){
			v = /\w+$/i.exec(url)[0];
			ChromeExt.postMessage({addToPlaylist:true,videoId:v});
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
			case "loop_single":
			$(this).attr("state","shuffle").css("background-image","url(img/shuffle.png)");
			break;
			default:
			$(this).attr("state","play_once").css("background-image","url(img/button_arrow.png)");
			break;
		}
	})
	$("#YTPlaylit_button-next").on("click",function(){
		Playlist.playNextVideo();
	})
	$("#YTPlaylist_search").on("keyup",function(){
		$("#playlist>li").css("display","list-item");
		var search = $(this).val();
		if(search && search !== ""){
			var patt = new RegExp(".*"+search+".*","igm");
			for(i in Playlist.list){
				if(!patt.test(Playlist.list[i].snippet.channelTitle) && !patt.test(Playlist.list[i].snippet.title)){
					$("#playlist>li[video_id="+Playlist.list[i].id+"]").css("display","none");
				}
			}
		}
	})
}
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


// Else

function getVarsFrom(url)
{
	if(!url) return [];
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