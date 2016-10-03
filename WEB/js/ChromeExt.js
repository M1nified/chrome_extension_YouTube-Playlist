class ChromeExt{
	static get extensionid(){return Settings.EXTENSION_ID;}
	static connect(){
		return new Promise((resolve,reject)=>{
			// Connection
			ChromeExt.port = chrome.runtime.connect(ChromeExt.extensionid);
			ChromeExt.port.onMessage.addListener(ChromeExt.onmessage.bind(ChromeExt));
			ChromeExt.port.onDisconnect.addListener(()=>{
				ChromeExt.port = null;
			})

			// Run messages
			ChromeExt.port.postMessage({test:7357});
			ChromeExt.port.postMessage({getPlaylist:true});

			resolve();
		})
	}
	static onmessage(msg){
		console.log("MSG",msg);
		if(msg.available !== undefined){
			console.log("CONNNECTED TO EXTENSION");
			try{loadingEnd();}catch(e){console.warn("Loading might not be finished.")}
		}else if(msg.type == "playlist"){
			Playlist.list = msg.data;
			if(msg.data && msg.data.length > 0){
				YouTubePlayer.playVideo(msg.data[0].id);
			}
		}else if(msg.type == "playlist_update"){
			Playlist.list = msg.data;
			Playlist.fillPlaylist();
		}
	}
	static postMessage(msg){
		console.log("postMessage",msg);
		ChromeExt.port.postMessage(msg);
	}
}