YTPlayer_settings_loop = false;
website_port = null;
$(document).ready(function(){
	getSettings();
	setStorageListeners();
})
function getVarsFrom(url){
	var vars = {};
	var hashes = url.slice(url.indexOf('?') + 1).split('&');
	console.log(hashes)
	for(var i = 0; i < hashes.length; i++)
	{
		var hash = hashes[i].split('=');
		if(hash && hash[0] && hash[1]){
			vars[hash[0]] = hash[1].split('#')[0];
		}
	}
	return vars;
}
function setUrlVar(url,name,value){
	var vars = getVarsFrom(url);
	vars[name] = value;
	console.log(vars);
	console.log($.param(vars));
	var newurl = url.split('?')[0] + '?' + $.param(vars);
	return newurl;
}

chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
	console.log(request)
	switch(request.func){
		case "addToPlaylist":
		addToPlaylist(request.videoId);
		break;
		case "removeFromPlaylist":
		removeFromPlaylist(request.videoId);
		break;
		case "playNextVideo":
		playNextVideo(request.videoId,sender.tab);
		break;
		case "openOptionsPage":
		window.open(chrome.runtime.getURL("html/options.html"));
		break;
	}
});
chrome.runtime.onInstalled.addListener(function() {
	setPageActionIcon();
});
var addToPlaylistByUrl = function(info,tab){
	console.log(info.linkUrl);
	if(info.linkUrl.match(/.*youtube.com\/watch.*/)){
		//console.log(1)
		addToPlaylist(getVarsFrom(info.linkUrl)['v']);
	}else if(info.linkUrl.match(/.*youtu.be\/.+/)){
		var newvideoid = info.linkUrl.split('?')[0].split('youtu.be/')[1];
		addToPlaylist(newvideoid);
		//console.log(2)
	}
}
chrome.contextMenus.create({type:"normal",id:"YTPlaylistAddToPlaylistButton",title:"Add to playlist",contexts:["link"],onclick:addToPlaylistByUrl,targetUrlPatterns:["https://www.youtube.com/watch*","http://www.youtube.com/watch*","https://www.youtu.be/*","http://www.youtu.be/*","https://youtube.com/watch*","http://youtube.com/watch*","https://youtu.be/*","http://youtu.be/*",]},function(){})
//chrome.contextMenus.create({type:"normal",id:"YTPlaylist_PrivatePlayer",title:"Open Dedicated Player",contexts:["page_action"],onclick:function(){openPrivatePlayer();}},function(){console.log("READY");});
var setPageActionIcon = function(){
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		console.log("1");
		chrome.declarativeContent.onPageChanged.addRules([
		{
			conditions: [
			new chrome.declarativeContent.PageStateMatcher({
				pageUrl: { urlContains: 'youtube.com' },
			})
			],
			actions: [ new chrome.declarativeContent.ShowPageAction() ]
		}
		]);
	});
};
var openPrivatePlayer = function(){
	window.open("http://www.prowebject.com/YTPlayer/private_player.html");
	//chrome.windows.create({url:"http://prowebject.com/YTPlayer/private_player.html"),focused:true,},function(win){	})
}
chrome.pageAction.onClicked.addListener(function(tab){
	console.log(tab)
	var newvideoid = getVarsFrom(tab.url)['v'];
	if(newvideoid){
		addToPlaylist(getVarsFrom(tab.url)['v']);
		chrome.tabs.update(tab.id,{url:setUrlVar(tab.url,'YTPlayer',true)},function(tab){});
	}else{
		runPlayer0(tab);
	}
});
var setStorageListeners = function(){
	chrome.storage.onChanged.addListener(function(changes,areaName){
		if(changes.loop){
			YTPlayer_settings_loop = changes.loop.newValue;
		}
		if(changes.playlist){
			if(website_port){
				website_port.postMessage({type:"playlist_update",data:changes.playlist.newValue});
			}
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
var runPlayer0 = function(tab){
	chrome.storage.local.get({playlist:null},function(data){
		console.log(data)
		if(data.playlist && data.playlist.length > 0){
			chrome.tabs.update(tab.id,{url:'http://www.youtube.com/watch?v='+data.playlist[0].id+'&YTPlayer=true'},function(tab){});
		}
	});
}
var addToPlaylist = function(videoId){
	console.log(videoId)
	if(!videoId){return;}
	chrome.storage.local.get({playlist:null},function(data){
		if(data.playlist){
			var item = $.grep(data.playlist,function(n){return n.id == videoId;});
			if(item && item.length > 0){return;}
		}
		$.get("https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id="+videoId+"&key=AIzaSyBXZFXvsNgTQikuqCN6tFAjprOO4sEz8LU",function(ytdata){
			console.log(ytdata)
			var snippet = null;
			var duration = null;
			if(ytdata.items || ytdata.items.length > 0){
				snippet = ytdata.items[0].snippet;
				snippet.description = null;
				snippet.thumbnails = null;
				duration = ytdata.items[0].contentDetails.duration;
				duration = duration.slice(duration.indexOf('T') + 1);
				var s = parseInt(duration.slice(duration.indexOf('S')+1)) || 0;
				var m = parseInt(duration.slice(duration.indexOf('M')+1)) || 0;
				var h = parseInt(duration.slice(duration.indexOf('H')+1)) || 0;
				duration = h + 60*m + 3600*s;
				console.log(duration)
			}
			if(data.playlist && data.playlist.length > 0){
				data.playlist.push({id:videoId,snippet:snippet,duration:duration});
			}else{
				data.playlist = [{id:videoId,snippet:snippet}];
			}
			console.log(data.playlist)
			chrome.storage.local.set({playlist:data.playlist},function(){});
		});
});
};
var removeFromPlaylist = function(videoId){
	console.log(videoId)
	chrome.storage.local.get({playlist:null},function(data){
		if(data.playlist){
			data.playlist = $.grep(data.playlist,function(n,i){return n.id == videoId || !n || !n.id;},true);
		}
		chrome.storage.local.set({playlist:data.playlist},function(){});
	});
};
var moveVideo = function(videoId,newposition){
	chrome.storage.local.get("playlist",function(data){
		if(data.playlist){
			var playlist = data.playlist;
			var index = null;
			for(i in playlist){
				if(playlist[i].id==videoId){
					index = i;
					break;
				}
			}
			var item = playlist[index];
			playlist.splice(index,1);
			playlist.splice(newposition,0,item);
			chrome.storage.local.set({playlist:playlist},function(){});
		}
	})
}
var changeVideoToBePlayedState = function(videoId,state){
	chrome.storage.local.get("playlist",function(data){
		if(data.playlist){
			var playlist = data.playlist;
			var index = null;
			for(i in playlist){
				if(playlist[i].id==videoId){
					index = i;
					break;
				}
			}
			playlist[index].tobeplayed=state;
			chrome.storage.local.set({playlist:playlist},function(){});
		}
	})
}
var playNextVideo = function(videoId,tab){
	console.log(videoId)
	chrome.storage.local.get({playlist:null},function(data){
		if(data.playlist && data.playlist.length > 0){
			//console.log(data.playlist)
			var index = null;
			$.grep(data.playlist,function(n,i){if(n.id == videoId){index = i;} return false;});
			console.log("INDEX: " + index)
			if(data.playlist[0].id == videoId){
				index = 0;
				console.log(6);
			}
			if(index !== null){
				index++;
				if(index >= data.playlist.length){
					index = 0;
					console.log(1);
					if(!YTPlayer_settings_loop){return;}
				}
				console.log(2);
				tab.url = setUrlVar(tab.url,'v',data.playlist[index].id);
			}else{
				console.log(3);
				tab.url = setUrlVar(tab.url,'v',data.playlist[0].id);
			}
			console.log(4);
		}

		console.log(5);
		//console.log(tab.url)
		chrome.tabs.update(tab.id,{url:setUrlVar(tab.url,'YTPlayer',true)},function(tab){});
	})
}
/*WEB ACCESSIBLE*/
chrome.runtime.onConnectExternal.addListener(function(port) {
	console.log(port);
	website_port = port;
	port.onDisconnect.addListener(function(){
		website_port = null;
	})
	port.onMessage.addListener(function(msg) {
		console.log("MESSAGE")
		console.log(msg)
		if (msg.test == 7357)
			port.postMessage({available:true});
		else if (msg.getPlaylist){
			chrome.storage.local.get("playlist",function(data){
				port.postMessage({type:"playlist",data:data.playlist});
			})
		}
		else if (msg.clearPlaylist){
			chrome.storage.local.set({playlist:null},function(){});
		}
		else if(msg.removeVideo && msg.videoId){
			var videoId = msg.videoId;
			chrome.storage.local.get("playlist",function(data){
				var index = null;
				for(i in data.playlist){
					if(data.playlist[i].id==videoId){
						index = i;
						break;
					}
				}
				if(index){
					data.playlist.splice(index,1);
					chrome.storage.local.set({playlist:data.playlist});
				}
			})
		}
		else if(msg.addToPlaylist && msg.videoId){
			addToPlaylist(msg.videoId);
		}
		else if(msg.moveVideo && msg.videoId && msg.newposition){
			moveVideo(msg.videoId,msg.newposition);
		}
		else if(msg.changeToBePlayedState && msg.videoId){
			changeVideoToBePlayedState(msg.videoId,msg.state);
		}
	});
});