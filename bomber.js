
var kmBomber = {
	isDebug: true,
	version: "1.0.1",
	imagePath: "assets/img/",
	images: {
		plane : "bomber.png",
		bomb : "bomb.png",
		bombvert : "bombv.png",
		building : {
			_1 : {
				base : "building1_base.png",
				shaft : "building1_shaft.png",
				capital : "building1_capital.png",
				broken : "building1_broken.png"
			}
		},
		rank : {
			airman: "rank_airman.png",
			sergeant: "rank_sergeant.png",
			lieutenant: "rank_lieutenant.png",
			captain: "rank_captain.png",
			major: "rank_major.png",
			colonel: "rank_colonel.png",
			general: "rank_general.png"
		}
	},
	soundPath: 'assets/sound/',
	tracks: {
		explosion : "explosion.wav",
		cheer : "cheer.wav",
		rocket : "rocket.wav"
	},
	ranks: ["Airman", "Sergeant", "Lieutenant", "Captain", "Major", "Colonel", "General"],
	time: null,
	level: 1,
	maxLevels: 3,
	planeStart: {x:-120, y:82}
};

kmBomber.init = function() {
	kmBomber.log("km-Bomber version " + kmBomber.version);
    kmBomber.canvas = document.getElementById("canvas");
	kmBomber.context = kmBomber.canvas.getContext("2d");
	kmBomber.objects = {
		plane: new Plane(kmBomber.planeStart.x, kmBomber.planeStart.y),
		buildings: getBuildings(1),
		bombs : []
	};
	kmBomber.hud = new HUD();
	kmBomber.timer = new Timer();
	kmBomber.player = new Player();
	kmBomber.startMenu(function(){
		var userData = kmBomber.player.load();
		kmBomber.start();
	});
	
};

kmBomber.startMenu = function(callback){
	kmBomber.log("loading menu");
	var menuPlane = new Plane(-102, 40);
	menuPlane.ySpeed = 0;
	menuPlane.y = 20;
	kmBomber.plane = menuPlane;
	kmBomber.runMenu();

	document.getElementById("start").addEventListener("click", function(e){
		e.preventDefault();
		var name = document.getElementById("name");
		var nameStr = name.value;
		var msg = "";
		nameStr = nameStr.trim();
		if (!nameStr.match(/^[\w\s]{3,10}$/)){
			var err = document.getElementById("nameError");
			if (nameStr.length < 3 || nameStr.length > 10){
				msg = "The name must be 3-10 characters long";
			} else  {
				msg = "Only letters and numbers are allowed";
			}
			err.innerHTML = msg;
			err.style.display= "block";
			name.focus();
		} else {
			kmBomber.player.name = nameStr;
			document.getElementById("startMenu").style.display = "none";
			callback();
		}
	});
};

kmBomber.runMenu = function() {
    var now = new Date().getTime(),
        dt = now - (kmBomber.time || now);
 
    kmBomber.time = now;
    kmBomber.plane.move(dt, kmBomber.canvas);
	kmBomber.context.clearRect(0,0,kmBomber.canvas.width, kmBomber.canvas.height);
	if (kmBomber.started !== true)
	{
		kmBomber.context.drawImage(kmBomber.plane.img, kmBomber.plane.x, kmBomber.plane.y);
    	requestAnimationFrame(kmBomber.runMenu);
	} 
};

kmBomber.levelMenu = function(status, callback){
	kmBomber.log("loading level menu");

	if (kmBomber.player.isPromoted === true){
		var rank = kmBomber.ranks[kmBomber.player.rank].toLowerCase();
		var img = "<img src='" + kmBomber.imagePath + kmBomber.images.rank[rank] + "'>";
		document.getElementById("rank").innerHTML = kmBomber.ranks[kmBomber.player.rank] + img;

		document.getElementById("congratsPromo").style.display = "block";
	} else {
		document.getElementById("congratsPromo").style.display = "none";
	}
	if (status === "gamecomplete"){
		document.getElementById("congrats").innerHTML = "Victory!";
		document.getElementById("congratsLevel").style.display = "none";
		document.getElementById("nxtLevel").value = "Restart";
	} else if(status === "gameover") {
		document.getElementById("congrats").style.display = "none";
		document.getElementById("congratsLevel").style.display = "none";
		document.getElementById("congratsPromo").style.display = "none";
		document.getElementById("gameOver").style.display = "block";
	    document.getElementById("sky").style.opacity = "0.5";
		document.getElementById("nxtLevel").value = "Restart";
		document.getElementById("nxtLevel").style.top = "120px";
	} else	{
		document.getElementById("congrats").style.display = "block";
		document.getElementById("level").innerHTML = kmBomber.level;
		document.getElementById("nxtLevel").value = "Start level " + (kmBomber.level + 1);
		document.getElementById("congratsLevel").style.display = "block";
	}
	document.getElementById("levelMenu").style.display = "block";
	document.getElementById("nxtLevel").addEventListener("click", function(e){
		e.preventDefault();
		document.getElementById("nxtLevel").removeEventListener(e.type, arguments.callee);
		document.getElementById("levelMenu").style.display = "none";
		document.getElementById("gameOver").style.display = "none";
	    document.getElementById("sky").style.opacity = "1.0";
		callback();
	});


};

kmBomber.start = function(){
	kmBomber.hud.init();
	kmBomber.hud.updateLabels();
	kmBomber.canvas.setAttribute('tabindex','0');
	kmBomber.canvas.focus();

	kmBomber.log("game starts");
	kmBomber.started = true;

	kmBomber.run(Date.now, Date.now);
};

kmBomber.restart = function(){
	kmBomber.level = 1;
	kmBomber.player.score = 0;
	kmBomber.startLevel(kmBomber.level);
};

kmBomber.startLevel = function(level){
	kmBomber.objects.plane.init(level, kmBomber.planeStart.x, kmBomber.planeStart.y);
	kmBomber.hud.init();
	kmBomber.canvas.setAttribute('tabindex','0');
	kmBomber.canvas.focus();
	kmBomber.player.isPromoted = false;
	kmBomber.objects.buildings = getBuildings(level);
	kmBomber.objects.bombs = [];
	
	kmBomber.run(Date.now, Date.now);
	
};

kmBomber.run = function(nowTime, lastTime) {
		
	plane = kmBomber.objects.plane;
	bombs = kmBomber.objects.bombs;
    buildings = kmBomber.objects.buildings;
    canvas = kmBomber.canvas;
    context = kmBomber.context;

    //show FPS
    if (!!kmBomber.isDebug)
    {
		kmBomber.timer.tick(Date.now());
		kmBomber.timer.display(kmBomber.timer.fps());
	}

	//move plane
	plane.move(nowTime - lastTime, canvas);
	if (plane.hasCollided(buildings)){
		kmBomber.log("plane crashed");
		plane.status = "crashed";
		kmBomber.player.gameOver();
		return;
	}
	kmBomber.player.update(kmBomber.objects);//check if player presses keys
    
	//move bombs
	for (indx = 0; indx < bombs.length; indx++){
		if (bombs[indx].move(nowTime - lastTime, canvas)){
			if (bombs[indx].hasCollided(buildings[bombs[indx].buildingNr])){
				buildings[bombs[indx].buildingNr].hit(bombs[indx]);
			}
		}
	}

    // clear canvas
    context.clearRect(0, plane.y - 2, canvas.width, canvas.height);

    //draw objects
    for (indx = 0; indx < buildings.length; indx++)
    {
    	buildings[indx].draw(context);
    }

    if (plane.status !== "crashed"){
	    context.drawImage(plane.img, plane.x, plane.y);
	    if (plane.status !== "landed"){
			for (indx = 0; indx < bombs.length; indx++){
				bombs[indx].draw(context);
			}
		    requestAnimationFrame(
		        function(timestamp){
		        	kmBomber.run(timestamp, nowTime);
		        }
		    );
	    } else {
			kmBomber.player.levelUp();
			return;
	    }
	}
};


/*
kmBomber.setSun = function(){
	if (!!kmBomber.started){
		var obj = document.getElementById("sun");
		obj.style.right = ((parseInt(obj.style.right, 10) || 40) - 1) + "px";
	    obj.style.bottom = ((parseInt(obj.style.right, 10) || 160) - 2) + "px";
	}
	if (kmBomber.finished){
		clearInterval(intervalId);
	}
};
*/


function Player(){
	this.name = '';
	this.isPromoted = false;
	this.timesPlayed = 0;
	this.hiScore = 0;
	this.level = 1;
	this.score = 0;
	this.rank = 0;
}

Player.prototype = {
	update: function(obj) {
		if (Key.isDown(Key.SPACE)){
			obj.plane.tryBombDrop(obj.bombs);
		}
	},
	load: function(){
		var userData = localStorage.getItem(this.name.toLowerCase());
		userData = JSON.parse(userData);
		if (userData){
			this.timesPlayed = parseInt(userData.timesPlayed, 10) || 0;
			this.hiScore = parseInt(userData.hiScore, 10) || 0;
			this.rank = parseInt(userData.rank, 10) || 0;
		}
	},
	save: function(){
		var toSave = {
			'name': this.name,
			'hiScore': this.getHiScore(),
			'timesPlayed': (this.timesPlayed + 1) || 1,
			'rank': this.rank
		};
		localStorage.setItem(this.name.toLowerCase(), JSON.stringify(toSave));
	},
	levelUp: function(){
		kmBomber.Sounds("cheer").play();

		//Bonus score for completing level
		this.score+= Math.pow(kmBomber.level, 2) * 200;
		//Bonus score for remaining bombs
		//...
		kmBomber.hud.updateScore(this);
		this.checkPromotion();
		if (kmBomber.level < kmBomber.maxLevels){

			kmBomber.levelMenu("levelcomplete", function(){
				kmBomber.level++;
				kmBomber.log('Start level ' + kmBomber.level);
				kmBomber.startLevel(kmBomber.level);
			});
		} else {
			setTimeout(function(){ 
				kmBomber.Sounds("cheer").play(); 
				setTimeout(function(){ 
					kmBomber.Sounds("cheer").play(); 
				}, 1800);
			}, 800);
			this.completedGame();
		}
	},
	getHiScore: function(){
		return (this.score > this.hiScore ? this.score: this.hiScore) || 0;
	},
	checkPromotion: function(){
		this.isPromoted = false;
		if (this.rank < kmBomber.level){
			this.rank = kmBomber.level;
			this.isPromoted = true;
		} else {
			if (kmBomber.level === kmBomber.maxLevels && this.rank < kmBomber.ranks.length - 1){
				this.rank++;
				this.isPromoted = true;
			}
		}
	},
	gameOver : function(){
	    kmBomber.log("game over");
	    this.save();
		this.hiScore = this.getHiScore();
		kmBomber.levelMenu("gameover", function(){
			kmBomber.log('Restart'); 
			kmBomber.restart();
		});

	},
	completedGame: function(){
		kmBomber.log("game completed");
	    this.save();


		kmBomber.levelMenu("gamecomplete", function(){
			kmBomber.log('Restart');
			kmBomber.restart();
		});
	}
};

function HUD(){
	this.display = true;
    this.canvas = document.getElementById("hud");
	this.context = this.canvas.getContext("2d");
	this.bombImg = new Image();
	this.bombImg.src = kmBomber.imagePath + kmBomber.images.bombvert;
	this.bombRange = {x: 410, y:60, w:200, h:40};
	this.bombsPerRow = 20;
	this.scoreRange = {x: 494, y:10, w:200, h:30};
	this.context.textBaseline = "top";
}

HUD.prototype = {
	init: function(){
		this.updateBombs(kmBomber.objects.plane);
		this.updateScore(kmBomber.player);
		this.updatePlayer(kmBomber.player);
		this.updateRank(kmBomber.player);
		this.updateLevel();
	},
	updateLabels: function(){
		this.context.font = "26px Verdana";
		this.context.fillText("Score: ", this.bombRange.x, this.scoreRange.y);
		this.context.font = "14px Verdana";
		this.context.fillText("High Score: ", this.bombRange.x, this.scoreRange.y + 30);
	},  
	updateBombs: function(plane){
		this.context.clearRect(this.bombRange.x, this.bombRange.y, this.bombRange.w, this.bombRange.h);
		for (var i = 0; i < plane.nrOfBombsLeft; i++){
			this.context.drawImage(this.bombImg, this.bombRange.x + (i % this.bombsPerRow) * 9, this.bombRange.y + Math.floor(i / this.bombsPerRow) *20 );
		}
	},
	updateScore: function(player){
		this.context.font = "26px Verdana";
		this.context.clearRect(this.scoreRange.x, this.scoreRange.y, this.scoreRange.w, this.scoreRange.h);
		this.context.fillText(this.pad(player.score.toString(), 6), this.scoreRange.x, this.scoreRange.y);
	},
	updateLevel: function(player){
		this.context.font = "14px Verdana";
		this.context.clearRect(0, this.scoreRange.y + 30, 80, 100);
		this.context.fillText("Level: " + kmBomber.level, 10, this.scoreRange.y + 30);
	},
	updatePlayer: function(player){
		this.context.font = "26px Verdana";
		this.context.clearRect(0, 0, 400, 100);
		this.context.fillText(player.name, 10, this.scoreRange.y);
		//player high score
		this.context.font = "14px Verdana";
		this.context.clearRect(this.scoreRange.x, this.scoreRange.y + 30, 200, 20);
		this.context.fillText(this.pad(player.hiScore.toString(), 6), this.scoreRange.x, this.scoreRange.y + 30);
	},
	updateRank: function(player){
		var txt = "Rank: " + kmBomber.ranks[player.rank];
		this.context.font = "14px Verdana";
		this.context.clearRect(0, this.scoreRange.y + 30, 300, 100);
		this.context.fillText(txt, 82, this.scoreRange.y + 30);
		
		var rank = kmBomber.ranks[kmBomber.player.rank].toLowerCase();
		var rankImg = new Image();
		rankImg.src = kmBomber.imagePath + kmBomber.images.rank[rank];
		this.context.drawImage(rankImg, 82 + 2 + this.context.measureText(txt).width, this.scoreRange.y + 30);
	},
	pad: function(str, max) {
  		return str.length < max ? this.pad("0" + str, max) : str;
  	}
};


function Plane(posX, posY){
	this.img = new Image();
	this.xStart = posX || 0;
	this.yStart = posY || 80;
	this.xSpeed = 0.07;
	this.ySpeed = 0.005;
	this.img.src = kmBomber.imagePath + kmBomber.images.plane;
	this.nrOfBombs = 40;
	this.init(1, posX, posY);
}

Plane.prototype ={
	init: function(level, posX, posY){
		this.lastTimeBombDropped = 0;
		this.nrOfBombsDropped = 0;
		this.nrOfBombsLeft = this.nrOfBombs;
		this.x = posX;
		this.y = posY;
		this.status = "airborne";
	},
	move: function(timeDelta, canvas){
	    if (this.x > canvas.width) {
	        this.x = this.xStart;
	    }
	    if ((this.y + this.img.height) >= canvas.height){
	    	this.status = "landed";
	    	kmBomber.log("plane landed");
	    } else {
		    this.x += this.xSpeed * (timeDelta || 0);
		    this.y += this.ySpeed * (timeDelta || 0);
		}
	},
	tryBombDrop: function(bombs){
		var curTimeStamp = Math.floor(Date.now() / 100);
		//Check if plane in frame has reloaded
		if (this.x > -this.img.width / 2 && (this.x + this.img.width / 2) < canvas.width)
		{
			//check if bomb has been loaded
			if(this.nrOfBombsLeft > 0 && curTimeStamp - this.lastTimeBombDropped > 6)
			{
				this.dropBomb(bombs);
			}
		}
	},
	dropBomb: function (bombs){
		this.nrOfBombsLeft--;
		this.nrOfBombsDropped++;
			this.lastTimeBombDropped = Math.floor(Date.now() / 100);
			var bomb = new Bomb(this.x + this.img.width / 2, this.y + this.img.height + 5, bombs.length);
			bombs.push(bomb);
			kmBomber.hud.updateBombs(this);
	},
	hasCollided: function(buildings){
		var noseX = Math.floor(this.x) + this.img.width,
			noseY = Math.floor(this.y) + this.img.height - 6,
			bellyX = Math.floor(this.x + this.img.width / 2),
			bellyY = Math.floor(this.y) + this.img.height,
			building = buildings[Math.floor(noseX / 30)];
		//Check plane nose
		if (building){
			if (building.floors > 0 && noseY > building.top){
				this.hit();
				return true;
			}
		}
		//Check plane belly
		building = buildings[Math.floor(bellyX / 30)];
		if (building){
			if (building.floors > 0 && bellyY > building.top){
				this.hit();
				return true;
			}
		}
		return false;
	},
	hasLanded: function(){
		return (this.status === "landed");
	},
	hit: function(){
		kmBomber.Sounds("explosion").play();
	}
};

function Bomb(xPos, yPos, ID){
	//position bomb in middle of building
	this.id = ID;
	this.buildingNr = Math.floor(xPos / 30);
	this.x = this.buildingNr * 30 + 6;
	this.y = yPos;
	this.active = true;
	this.size = 1;//small bomb
	this.impact = Math.floor(Math.random() * 3) + this.size + 1; //#of floors it damages
	this.img = new Image();
	var thisBomb = this;
	this.img.src = kmBomber.imagePath + kmBomber.images.bomb;
}

Bomb.prototype = {
	move: function(timeDelta, canvas){
		if (!this.active) return false;
	    if ((this.y + this.img.height) <= canvas.height){
	    	this.y++;
	    	return true;
	    }
	    else {
	    	this.remove();
	    	return false;
	    }
	},
	draw: function(ctx){
		if (!this.active) return;
		ctx.drawImage(this.img, this.x, this.y);
	},
	remove: function(){
		this.active = false;
	},
	hasCollided: function(building){
		if (!!building){
			return this.y + this.img.height >= building.top;
		}
	}
};

function Building(xPos, yPos, nr){
	this.x = xPos;
	this.y = yPos;
	this.nr = nr;
	this.maxFloors = 8;
	this.floors = this.getFloors();
	this.top = yPos;
	this.isIntact = true;
	this.isDestroyed = false;
}

Building.prototype ={
	img: function() {
		base = new Image();
		base.src = kmBomber.imagePath + kmBomber.images.building["_" + this.nr].base;
		shaft = new Image();
		shaft.src = kmBomber.imagePath + kmBomber.images.building["_" + this.nr].shaft;
		capital = new Image();
		capital.src = kmBomber.imagePath + kmBomber.images.building["_" + this.nr].capital;
		broken = new Image();
		broken.src = kmBomber.imagePath + kmBomber.images.building["_" + this.nr].broken;

		return {
			base: base, 
			shaft: shaft,
			capital: capital,
			broken: broken
		};
	},
	draw: function(ctx){
		var img = this.img();
		if (this.floors > 0){
			ctx.drawImage(img.base, this.x, this.y-4);
		}
		for (var indx = 1; indx <= this.floors; indx++)
		{
			if (this.isIntact || indx < this.floors){
				ctx.drawImage(img.shaft, this.x, this.y-4-20*indx);
			}
			else if (indx === this.floors){
				ctx.drawImage(img.broken, this.x, this.y-4-20*indx);
			}
		}
		this.top = this.y-7-20*(indx - 1);
		if (this.isIntact){
			ctx.drawImage(img.capital, this.x, this.top);
		} else {
			this.top+= 3;
		}
	},
	getFloors: function(){
		var canvasWidth = document.getElementById('canvas').width,
			divider = (canvasWidth / 2) / this.maxFloors,
			maxFloors = this.maxFloors - Math.floor(Math.abs((this.x - canvasWidth/2) / divider)),
			minFloors = Math.floor(this.maxFloors / 6) + (kmBomber.level - 1);


		return Math.floor(Math.random() * maxFloors + minFloors);
	},
	hit: function(bomb){
		if (this.toDestroy > 0){
			kmBomber.Sounds("explosion").play();
		}
		if (this.isIntact || this.bombId !== bomb.id){
			this.bombId = bomb.id;
			this.toDestroy = bomb.impact > this.floors ? this.floors : bomb.impact;
			this.isIntact = false;
		}
		else
		{
			if (this.toDestroy > 0){
				this.floors--;
				this.toDestroy--;
				kmBomber.player.score += 5;
				kmBomber.hud.updateScore(kmBomber.player);
				if (this.floors <= 0){
					this.isDestroyed = true;
					kmBomber.player.score += 3;
					kmBomber.hud.updateScore(kmBomber.player);
				}
			} else {
				bomb.remove();
			}
		}
	}
};


function getBuildings(level)
{
	var buildings = [],
		maxHeight,
		maxWidth,
		canvas = kmBomber.canvas;

	maxWidth = canvas.width;
	for (var indx = 0; indx < 20; indx++){
		buildings[indx] = new Building(30 * indx, 400, 1);
	}

	return buildings;
	//return [new Building(0,400,1)];
}

kmBomber.Sounds = function(track){
	var sound = new Audio(kmBomber.soundPath + kmBomber.tracks[track]);

	return sound;
};


var Key = {
  pressed: {},
  SPACE: 32,
  
  isDown: function(keyCode) {
    return this.pressed[keyCode];
  },
  onKeydown: function(event) {
   this.pressed[event.keyCode] = true;
  },
  onKeyup: function(event) {
    delete this.pressed[event.keyCode];
  }
};

function Timer () {
	this.elapsed = 0;
	this.last = null;
}
 
Timer.prototype = {
	tick: function (now) {
		this.elapsed = (now - (this.last || now)) / 1000;
		this.last = now;
	},
	fps: function () {
		return Math.round(1 / this.elapsed);
	},
	display: function(fps){
		context.clearRect(2, 2, 50, 50);
		context.fillText(fps, 2, 10);
	}
};

kmBomber.imgLoader = function(imagePath, images, callback){
	var list = [];
	var completed = [];
	var failed = [];
	var imgPath = imagePath;

    objectToArr(images);
    processImages();

	function processImages(){
		processImage(list[0], 0);
	}
	function processImage(imgSrc, indx){
		var image = new Image(),
		    loader = this;
		
		image.onerror = function(){
			failed.push(imgPath + imgSrc);
			kmBomber.log("Error loading file '" + imgPath + imgSrc + "'");
			checkFinished();
        };
		image.onload = function(){
		    completed.push(imgPath + imgSrc);
		    if (completed.length < list.length){
		    	processImage(list[indx + 1], indx + 1);
		    }
			checkFinished();
		};
		image.src = imgPath + imgSrc;
	}
	function checkFinished(){
		if (completed.length + failed.length >= list.length){
			callback();
		}
	}
	function objectToArr(obj) {
	    for(var key in obj) {
	    	if (typeof obj[key] === "string"){
	    		list.push(obj[key]);
	    	} else if (typeof obj[key] === "object"){
	    		objectToArr(obj[key]);
	    	}
	    }
	}

};

kmBomber.soundLoader = function(soundPath, tracks, callback){
	var list = [];
	var completed = [];
	var trackPath = soundPath;

    objectToArr(tracks);
    processTracks();

	function processTracks(){
		processTrack(list[0], 0);
	}

	function processTrack(track, indx){
		var sound = new Audio(trackPath + track);

		sound.oncanplay = function() {
		    completed.push(trackPath + track);
			if (completed.length >= list.length){
				callback();
			} else {
				processTrack(list[indx + 1], indx + 1);
			}
		};
	}
	function objectToArr(obj) {
	    for(var key in obj) {
	    	if (typeof obj[key] === "string"){
	    		list.push(obj[key]);
	    	}
	    }
	}

};

kmBomber.log = function(msg){
	if (!!kmBomber.isDebug){
		console.log(msg);
	}
};

function startOnEnter(e, btn)
{
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById(btn).click();
        return false;
    }
    return true;
}


document.addEventListener("DOMContentLoaded", function(event)
{ 
	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;
	window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
	window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);
	//var intervalID = window.setInterval("kmBomber.setSun()", 1000);
	kmBomber.soundLoader(kmBomber.soundPath, kmBomber.tracks, function (){
		kmBomber.imgLoader(kmBomber.imagePath, kmBomber.images, function (){
			kmBomber.init();
		});
	});

});
