class ttsBarker {
	// const url='ws://localhost:3800/api'
	// let webSocket
	
	constructor(overlayName, url, avatarUrl) {
		this.overlayName = overlayName || 'screen'
		this.url = url || 'ws://localhost:4689'
		this.avatarUrl = avatarUrl || 'https://apocist.pet/ttsBarker/avatars.json'
		this.containerElement = document.querySelector('container')
		this.rotationElement = document.querySelector('rotation')
		this.popupElement = document.querySelector('popup')
		this.avatarElement = document.querySelector('#avatar') // Not just <avatar> as we will reuse that for preloading images
		this.preloadElement = document.querySelector('preloader') // Always hidden
		
		this.stopTTS()
		this.loadAvatars()
		this.connect()
	}
	
	connect() {
		this.webSocket = new WebSocket(this.url)
		this.webSocket.onopen = (event) => {
			console.log('connected')
			this.webSocket.send(JSON.stringify({type:'subscribe', overlayName: this.overlayName}))
		}
		this.webSocket.onclose = (event) => {
			console.log('close')
			setTimeout(this.connect, 1000)
		}
		this.webSocket.onmessage = (event) => {
		  let message = JSON.parse(event.data)
		  switch (message.type) {
			case 'mouth':
				this.parseMouth(message)
				break
			case 'startTTS':
				this.startTTS(message)
				break
			case 'stopTTS':
				this.stopTTS()
				break
		  }
		}
	}
	
	/**
	* message = {username: string, overlayName: string}
	*/
	startTTS(message) {
		console.log('starts tts', message)
		if (!message.username) {
			return
		}
		let event = new EventSent()
		console.log('Event start', event)
		/*if (this.isJSON(message.user)) {
			event.fromObject(JSON.parse(message.user))
		}*/
		event.username = message.username
		
		// let [overlay, username] = message.user.split(':')
		/*if (!username) {
			overlay = 'screen'
			username = message.user
		}*/
		// if (event.overlay !== this.overlayName) {
		if (message.overlayName !== this.overlayName) {
			// if this is not meant for this overlay, don't use it
			return
		}
		if (!event.username) {
			// if there is no user, stop here
			return
		}
		console.log('Event', event)
		
		this.setRandomLocation()
		// Find the usernames hashed number (0-9)
		const hashedNumber = this.convertStringNumber(event.username)
		// Preload the lil guys off screen first so there is no blip
		this.preloadElement.className = 'default-'+hashedNumber+' user-'+event.username
		// Set the position of the lil guy
		this.rotationElement.className = 'default-'+hashedNumber+' user-'+event.username
		this.popupElement.className = 'speaking'
	}
	
	stopTTS() {
		// console.log('stops  tts')
		this.popupElement.className = 'poof'
		this.resetFrames()
	}
	
	parseMouth(message) {
		// console.log('parse mouth!', mouth)
		if(message.mouthOpen >= 0.7){
			// mouth fully open
			this.avatarElement.className = 'open-full'
		} else if (message.mouthOpen >= 0.2) {
			// mouth slight open (or more)
			this.avatarElement.className = 'open-part'
		} else {
			// mouth closed
			this.avatarElement.className = 'closed'
		}
	}
	
	resetFrames() {
		this.avatarElement.className = 'closed'
	}
	
	setRandomLocation() {
		const containerClassName = this.getRandomSideClassName()
		const containerPosition = this.getRandomPosition(containerClassName)
		
		
		// this.setContainerPosition('place-bottom', 40) // manual test
		this.setContainerPosition(containerClassName, containerPosition)
		// console.log('this.containerElement', this.containerElement)
	}
	
	setContainerPosition(containerClassName, containerPosition) {
		this.containerElement.style.setProperty('bottom', 'unset')
		this.containerElement.style.setProperty('left', 'unset')
		this.containerElement.className = containerClassName
		
		switch(containerClassName) {
			case 'place-left':
			case 'place-right':
				this.containerElement.style.setProperty('bottom', containerPosition + '%')
				break
			case 'place-top':
			case 'place-bottom':
				this.containerElement.style.setProperty('bottom', '0px')
			case 'place-top':
				this.containerElement.style.setProperty('left', containerPosition + '%')
				break
		}
	}
	
	getRandomSideClassName() {
		const side = Math.floor(this.getRandomBetween(1, 4))
		let sideName = 'BAD'
		switch(side) {
			case 1:
				sideName = 'left'
				break
			case 2:
				sideName = 'right'
				break
			case 3:
				sideName = 'top'
				break
			case 4:
				sideName = 'bottom'
				break
		}
		return 'place-' + sideName
	}
	
	getRandomPosition(className) {
		let movement = 30
		switch(className) {
			case 'place-left':
			case 'place-right':
				movement = this.getRandomBetween(30, 100)
				break
			case 'place-top':
			case 'place-bottom':
				movement = this.getRandomBetween(0, 85)
				break
		}
		return movement.toFixed(2)
	}
	
	getRandomBetween(min, max) {
		// return Math.random() * (max - min) + min;
		return Math.random() * (max - min + 1) + min
	}
	
	loadAvatars() {
		fetch(this.avatarUrl)
			.then((response) => response.json())
			// .then((json) => console.log(json))
			.then((json) => {
				console.log('json', json)
				let cssString
				if (json.default) {
					cssString = this.createDefaultCSS(json.default)
				}
				cssString += this.createAvatarCSS(json.users)
				console.log('new css \n', cssString)
				this.injectCSS(cssString)
			})
	}
	
	injectCSS = css => {
		  const el = document.createElement('style')
		  el.type = 'text/css'
		  el.id = 'avatar-css'
		  el.innerHTML = css
		  document.head.appendChild(el)
		  return el
	}
	createDefaultCSS(defaultList) {
		const cssList = []
		defaultList.forEach(defaultNum => {
			cssList.push(`.default-${defaultNum} avatar, .default-${defaultNum} avatar.closed { background-image: url("avatars/default/${defaultNum}/closed.png"); }
.default-${defaultNum} avatar.open-part { background-image: url("avatars/default/${defaultNum}/open-part.png"); }
.default-${defaultNum} avatar.open-part, .default-${defaultNum} avatar.open-full { background-image: url("avatars/default/${defaultNum}/open-full.png"); } `)
		})
		return cssList.join('\n')
	}
	createAvatarCSS(userList) {
		const cssList = []
		Object.keys(userList).forEach(username => {
			if (userList.hasOwnProperty(username)) {
				console.log('processing', username, userList[username])
				if (userList[username].hasOwnProperty('frames')) {
					if (userList[username].frames.includes('closed')) {
						cssList.push(`.user-${username} avatar, .user-${username} avatar.closed { background-image: url("avatars/${username}/closed.png"); }`)
					}
					if (userList[username].frames.includes('part')) {
						cssList.push(`.user-${username} avatar.open-part { background-image: url("avatars/${username}/open-part.png"); }`)
					}
					if (userList[username].frames.includes('full')) {
						if (!userList[username].frames.includes('part')) {
							cssList.push(`.user-${username} avatar.open-part,`)
						}
						cssList.push(`.user-${username} avatar.open-full { background-image: url("avatars/${username}/open-full.png"); }`)
					}
				}
			}
		})
		return cssList.join('\n')
	}
	isJSON(str) {
		try {
			JSON.parse(str)
		} catch (e) {
			return false
		}
		return true
	}
	/** Make a number between 0 - 9 from a string (returns string) */
	convertStringNumber(str) {
		let hash = 0, i, chr
		if (str.length === 0) return hash
		for (i = 0; i < str.length; i++) {
			chr = str.charCodeAt(i)
			hash = ((hash << 5) - hash) + chr
			hash |= 0 // Convert to 32bit integer
		}
		// return Number(hash.toString().slice(-1))
		return hash.toString().slice(-1)
	}
}

class EventSent {
	constructor (username, overlay) {
		this.username = username ?? null
		this.overlay = overlay ?? 'screen'
	}
	
	fromObject (obj) {
		if (!obj) {
			return this
		}
		this.username = obj.username ?? null
		this.overlay = obj.overlay ?? 'screen'
		return this
	}
}