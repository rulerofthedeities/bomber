'use strict';
    
var kmBomber = {
	isDebug: true,
	version: "1.1.3",
	imagePath: "assets/img/",
	images: {
		plane : "bomber.png",
		bomb : "bomb.png",
		bombvert : "bombv.png",
		missile : "missile.png",
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
		missile : "rocket.wav"
	},
	ranks: ["Airman", "Sergeant", "Lieutenant", "Captain", "Major", "Colonel", "General"],
	time: null,
	level: 4,
	maxLevels: 5,
	planeStart: {x:-120, y:82}
};

kmBomber.init = function() {
	kmBomber.log("km-Bomber version " + kmBomber.version);
    kmBomber.canvas = document.getElementById("canvas");
	kmBomber.context = kmBomber.canvas.getContext("2d");
	kmBomber.plane = new Plane(kmBomber.planeStart.x, kmBomber.planeStart.y);
	kmBomber.buildings = new Buildings();
	kmBomber.player = new Player();
	kmBomber.timer = new Timer();
	kmBomber.hud = new HUD();
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
	kmBomber.runMenu(menuPlane);

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

kmBomber.runMenu = function(plane) {
    var now = new Date().getTime(),
        dt = now - (kmBomber.time || now);
 
    kmBomber.time = now;
	plane.move(dt, kmBomber.canvas);
	if (kmBomber.started !== true)
	{
		plane.draw();
    	requestAnimationFrame(function(){kmBomber.runMenu(plane);});
	} else {
		plane.clear();
		kmBomber.log("Exit menu");
	}
};

kmBomber.levelMenu = function(status, callback){
	kmBomber.log("loading level menu");

	if (kmBomber.player.isPromoted === true){
		var img = "<img src='" + kmBomber.imagePath + kmBomber.images.rank[kmBomber.player.rankAlias()] + "'>";
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
	document.getElementById("nxtLevel").addEventListener("click", function btnClick(e){
		e.preventDefault();
		document.getElementById("nxtLevel").removeEventListener(e.type, btnClick);
		document.getElementById("levelMenu").style.display = "none";
		document.getElementById("gameOver").style.display = "none";
	    document.getElementById("sky").style.opacity = "1.0";

		kmBomber.log("exit level menu");
		callback();
	});


};

kmBomber.start = function(){
	kmBomber.started = true;
	kmBomber.hud.init();
	kmBomber.hud.updateLabels();
	kmBomber.canvas.setAttribute('tabindex','0');
	kmBomber.canvas.focus();

	kmBomber.log("game starts");
	kmBomber.buildings.draw();
	
	kmBomber.run();
};

kmBomber.restart = function(){
	kmBomber.level = 1;
	kmBomber.player.score = 0;
	kmBomber.startLevel(kmBomber.level);
};

kmBomber.startLevel = function(level){
	kmBomber.plane.init(kmBomber.planeStart.x, kmBomber.planeStart.y);
	kmBomber.hud.init();
	kmBomber.canvas.setAttribute('tabindex','0');
	kmBomber.canvas.focus();
	kmBomber.player.isPromoted = false;
	kmBomber.buildings = new Buildings();
	kmBomber.buildings.draw();
	kmBomber.time = null;

	kmBomber.run();
};

kmBomber.run = function() {
		
    var now = new Date().getTime(),
        dt = now - (kmBomber.time || now),
		plane = kmBomber.plane,
		bombs = plane.bombs,
		missiles = plane.missiles,
    	buildings = kmBomber.buildings.building,
    	player = kmBomber.player,
    	canvas = kmBomber.canvas,
    	context = kmBomber.context,
    	indx;
 
    kmBomber.time = now;

    //show FPS
    if (!!kmBomber.isDebug)
    {
		kmBomber.timer.tick(Date.now());
		kmBomber.timer.display(kmBomber.timer.fps());
	}

	//move plane
	plane.move(dt, canvas);
	if (plane.hasCollided(buildings)){
		kmBomber.log("plane crashed");
		plane.status = "crashed";
		player.gameOver();
		return;
	}
	player.update(kmBomber.plane);//check if player presses keys
    
	

    if (plane.status !== "crashed"){
    	plane.draw();
	    if (plane.status !== "landed"){

			//move bombs & missiles
			for (indx = 0; indx < bombs.length; indx++){
				if (bombs[indx].move(dt, canvas)){
					bombs[indx].draw();
					if (bombs[indx].hasCollided(buildings[bombs[indx].buildingNr])){
						buildings[bombs[indx].buildingNr].hitByBomb(bombs[indx]);
					}
				}
			}
			for (indx = 0; indx < missiles.length; indx++){
				if (missiles[indx].move(dt, canvas)){
					missiles[indx].draw();
					missiles[indx].checkCollision();
				}
			}

		    requestAnimationFrame(kmBomber.run);
		} else {
			player.levelUp();
			return;
	    }
	}
};

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
	update: function(plane) {
		if (Key.isDown(Key.SPACE)){
			plane.tryBombDrop();
		}
		if (Key.isDown(Key.ENTER)){
			plane.tryMissileLaunch();
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
		if (this.rank + 1 < kmBomber.level){
			this.rank = kmBomber.level - 1;
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
		this.hiScore = this.getHiScore();

		kmBomber.levelMenu("gamecomplete", function(){
			kmBomber.log('Restart');
			kmBomber.restart();
		});
	},
	rankName: function(){
		return kmBomber.ranks[this.rank];
	},
	rankAlias: function(){
		return this.rankName().toLowerCase();
	}
};

function HUD(){
	this.display = true;
    this.canvas = document.getElementById("hud");
	this.context = this.canvas.getContext("2d");
	this.bombImg = kmBomber.Images("bombvert");
	this.missileImg = kmBomber.Images("missile");
	this.bombRange = {x: 410, y:60, w:200, h:38};
	this.bombsPerRow = 20;
	this.missileRange = {x: 410, y:99, w:200, h:7};
	this.scoreRange = {x: 494, y:10, w:200, h:30};
	this.context.textBaseline = "top";
}

HUD.prototype = {
	init: function(){
		this.updateBombs(kmBomber.plane);
		this.updateMissiles(kmBomber.plane);
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
	updateMissiles: function(plane){
		this.context.clearRect(this.missileRange.x, this.missileRange.y, this.missileRange.w, this.missileRange.h);
		for (var i = 0; i < plane.nrOfMissilesLeft; i++){
			this.context.drawImage(this.missileImg, this.missileRange.x + i * 22, this.missileRange.y);
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
		this.context.clearRect(0, 0, 400, 40);
		this.context.fillText(player.name, 10, this.scoreRange.y);
		//player high score
		this.context.font = "14px Verdana";
		this.context.clearRect(this.scoreRange.x, this.scoreRange.y + 30, 200, 20);
		this.context.fillText(this.pad(player.hiScore.toString(), 6), this.scoreRange.x, this.scoreRange.y + 30);
	},
	updateRank: function(player){
		var txt = "Rank: " + kmBomber.ranks[player.rank];
		this.context.font = "14px Verdana";
		this.context.clearRect(0, this.scoreRange.y + 30, 400, 30);
		this.context.fillText(txt, 82, this.scoreRange.y + 30);
		
		var rankImg = kmBomber.Images(kmBomber.player.rankAlias(), kmBomber.images.rank);
		var hud = this;
		rankImg.onload = function(){
			hud.context.drawImage(rankImg, 82 + 2 + hud.context.measureText(txt).width, hud.scoreRange.y + 30);
		};
	},
	pad: function(str, max) {
  		return str.length < max ? this.pad("0" + str, max) : str;
  	}
};


function Plane(posX, posY){
	this.xStart = posX || 0;
	this.yStart = posY || 80;
	this.xSpeed = 0.07;
	this.ySpeed = 0.005;
	this.xDelta = 0;
	this.yDelta = 0;
	this.img = kmBomber.Images("plane");
	this.nrOfBombs = 40;
	this.init(posX, posY);
}

Plane.prototype ={
	init: function(posX, posY){
		this.lastTimeBombDropped = 0;
		this.nrOfBombsDropped = 0;
		this.nrOfBombsLeft = this.nrOfBombs;
		this.lastTimeMissileLaunched = 0;
		this.nrOfMissiles = 8;//kmBomber.level < 3 ? 0 : (kmBomber.level - 1) * 2;
		this.nrOfMissilesLaunched = 0;
		this.nrOfMissilesLeft = this.nrOfMissiles;
		this.x = posX;
		this.y = posY;
		this.status = "airborne";
		this.bombs = [];
		this.missiles = [];
	},
	move: function(timeDelta, canvas){
	    if (this.x > canvas.width) {
	        this.x = this.xStart;
	    }
	    if ((this.y + this.img.height) >= canvas.height){
	    	this.status = "landed";
	    	kmBomber.log("plane landed");
	    } else {
	    	this.xDelta = this.xSpeed * (timeDelta || 0);
	    	this.yDelta = this.ySpeed * (timeDelta || 0);
		    this.x += this.xDelta;
		    this.y += this.yDelta;
		}
	},
	draw: function(){
    	this.clear();
	    kmBomber.context.drawImage(this.img, this.x, this.y);
	},
	clear: function(){
		kmBomber.context.clearRect(this.x - this.xDelta, this.y - this.yDelta, this.img.width + this.xDelta, this.img.height + this.yDelta);
	},
	tryBombDrop: function(){
		var curTimeStamp = Math.floor(Date.now() / 100);
		//Check if plane in frame
		if (this.isInFrame("bomb")){
			//check if bomb has been loaded
			if(this.nrOfBombsLeft > 0 && curTimeStamp - this.lastTimeBombDropped > 6){
				this.dropBomb();
			}
		}
	},
	dropBomb: function (){
		this.nrOfBombsLeft--;
		this.nrOfBombsDropped++;
		this.lastTimeBombDropped = Math.floor(Date.now() / 100);
		var bomb = new Bomb(this.x + this.img.width / 2, this.y + this.img.height + 5, this.bombs.length);
		this.bombs.push(bomb);
		kmBomber.hud.updateBombs(this);
	},
	tryMissileLaunch: function(){
		var curTimeStamp = Math.floor(Date.now() / 100);
		//Check if plane in frame
		if (this.isInFrame("missile")){
			//check if missile has been loaded
			if(this.nrOfMissilesLeft > 0 && curTimeStamp - this.lastTimeMissileLaunched > 10){
				this.launchMissile();
			}
		}
	},
	launchMissile: function(){
		this.nrOfMissilesLeft--;
		this.nrOfMissilesLaunched++;
		this.lastTimeMissileLaunched = Math.floor(Date.now() / 100);
		var missile = new Missile(this.x + this.img.width + 1, this.y + this.img.height, this.missiles.length);
		missile.sound.play();
		this.missiles.push(missile);
		kmBomber.hud.updateMissiles(this);
		kmBomber.log("launch missile");
	},
	hasCollided: function(buildings){
		var noseX = Math.floor(this.x) + this.img.width,
			noseY = Math.floor(this.y) + this.img.height - 6,
			bellyX = Math.floor(this.x + this.img.width / 2),
			bellyY = Math.floor(this.y) + this.img.height + 1,
			building = buildings[Math.floor(noseX / 30)];
		//Check plane nose
		if (building){
			if (!building.isDestroyed && noseY > building.top){
				this.hit();
				return true;
			}
		}
		//Check plane belly
		building = buildings[Math.floor(bellyX / 30)];
		if (building){
			if (!building.isDestroyed && bellyY > building.top){
				this.hit();
				return true;
			}
		}
		return false;
	},
	hasLanded: function(){
		return (this.status === "landed");
	},
	isInFrame: function(tpe){
		var offset = tpe === "bomb" ? this.img.width / 2 : this.img.width;
		return this.x > -offset && (this.x + offset) < kmBomber.canvas.width;
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
	this.ySpeed = 0.08;
	this.delta = 0;
	this.active = true;
	this.size = 1;//small bomb
	this.impact = Math.floor(Math.random() * 3) + this.size + 1; //#of floors it damages
	this.img = kmBomber.Images("bomb");
}

Bomb.prototype = {
	move: function(timeDelta, canvas){
		if (!this.active) return false;
		this.delta = this.ySpeed * (timeDelta || 0);
	    if ((this.y + this.img.height) <= canvas.height){
		    this.y += this.delta;
	    	return true;
	    }
	    else {
	    	this.remove();
	    	return false;
	    }
	},
	draw: function(){
		if (!this.active) return;
		this.clear();
		kmBomber.context.drawImage(this.img, this.x, this.y);
	},
	clear: function(){
		kmBomber.context.clearRect(this.x, this.y - this.delta, this.img.width, this.img.height + this.delta);
	},
	remove: function(){
		this.active = false;
		this.clear();
	},
	hasCollided: function(building){
		if (!!building){
			return this.y + this.img.height >= building.top;
		}
	}
};


function Missile(xPos, yPos, ID){
	this.id = ID;
	this.x = xPos;
	this.y = yPos;
	this.xSpeed = 0.16;
	this.delta = 0;
	this.active = true;
	this.size = 1;
	this.impact = Math.round(Math.random()) + this.size; //#of buildings it damages
	this.sound = kmBomber.Sounds("missile");
	this.img = kmBomber.Images("missile");
}

Missile.prototype = {
	move: function(timeDelta, canvas){
		if (!this.active) return false;
		this.delta = this.xSpeed * (timeDelta || 0);
	    if (this.x > canvas.width){
	    	this.remove();
	    	return false;
	    }
	    else {
	    	this.x += this.delta;
	    	return true;
	    }
	},
	draw: function(){
		if (!this.active) return;
		this.clear();
		kmBomber.context.drawImage(this.img, this.x, this.y);
	},
	remove: function(){
		this.active = false;
		this.clear();
	},
	clear: function(){
		kmBomber.context.clearRect(this.x - this.delta, this.y, this.img.width + this.delta, this.img.height);
	},
	checkCollision: function(){
		var buildingNr = Math.floor((this.x + this.img.width + 1) / 30);
		var building = kmBomber.buildings.building[buildingNr];
		if (!!building && this.y + this.img.height + 1 >= building.top){
			 building.hitByMissile(this);
		}
	}
};

function Building(xPos, yPos, maxFloors, nr){
	this.x = xPos;
	this.y = yPos;
	this.nr = nr;
	this.floors = this.getFloors(maxFloors);
	this.top = yPos;
	this.isIntact = true;
	this.isDestroyed = false;
	this.imgs = this.img();
}

Building.prototype ={
	img: function() {
		var obj = kmBomber.images.building["_" + this.nr];

		return {
			base: kmBomber.Images("base", obj),
			shaft: kmBomber.Images("shaft", obj),
			capital: kmBomber.Images("capital", obj),
			broken: kmBomber.Images("broken", obj)
		};
	},
	draw: function(){
		var ctx = kmBomber.context;
		if (this.floors > 0){
			ctx.drawImage(this.imgs.base, this.x, this.y-4);
		}
		for (var indx = 1; indx <= this.floors; indx++)
		{
			if (this.isIntact || indx < this.floors){
				ctx.drawImage(this.imgs.shaft, this.x, this.y-4-20*indx);
			}
			else if (indx === this.floors){
				ctx.drawImage(this.imgs.broken, this.x, this.y-4-20*indx);
			}
		}
		this.top = this.y-7-20*(indx - 1);
		if (this.isIntact){
			ctx.drawImage(this.imgs.capital, this.x, this.top);
		} else {
			this.top+= 3;
		}

	},
	getFloors: function(maxFloors){
		var canvasWidth = document.getElementById('canvas').width,
			divider = (canvasWidth / 2) / maxFloors,
			topFloor = maxFloors - Math.floor(Math.abs((this.x - canvasWidth/2) / divider)),
			lowFloor = Math.floor(maxFloors / 6) + (kmBomber.level - 1);

		return Math.floor(Math.random() * topFloor + lowFloor);
	},
	hitByBomb: function(bomb){
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
		//redraw building
		this.clear();
		this.draw();
	},
	hitByMissile: function(missile){
		kmBomber.Sounds("explosion").play();
		missile.sound.pause();
		var nrOfFloorsToDestroy = Math.round(((missile.y + missile.img.height + 2) - this.top) / this.imgs.shaft.height) + 1;
		this.floors = this.floors < nrOfFloorsToDestroy ? 0 : this.floors - nrOfFloorsToDestroy;
		this.isIntact = false;
		missile.impact--;

		kmBomber.player.score += nrOfFloorsToDestroy * 8;
		kmBomber.hud.updateScore(kmBomber.player);
		if (missile.impact < 1){
			missile.remove();
		}
		this.clear();
		this.draw();
	},
	clear: function(){
		kmBomber.context.clearRect(this.x, this.initialTop, this.imgs.base.width, kmBomber.canvas.height - this.initialTop);
	}
};


function Buildings()
{
	this.building = [];
	this.nrOfBuildings = 20;
	this.buildingWidth = kmBomber.canvas.width / this.nrOfBuildings;
	this.buildingBase = kmBomber.canvas.height;
	this.maxFloors = 7 + kmBomber.level;
	this.init();
}

Buildings.prototype = {
	init: function(){   
		for (var indx = 0; indx < this.nrOfBuildings; indx++){
			this.building[indx] = new Building(this.buildingWidth * indx, this.buildingBase, this.maxFloors, 1);
		}
	},
	draw: function(){
		kmBomber.context.clearRect(0, 0, kmBomber.canvas.width, kmBomber.canvas.height);
		for (var indx = 0; indx < this.building.length; indx++){
	    	this.building[indx].draw();
	    	this.building[indx].initialTop = this.building[indx].top;
	    } 
	}
};


kmBomber.Sounds = function(track){
	var sound = new Audio(kmBomber.soundPath + kmBomber.tracks[track]);

	return sound;
};

kmBomber.Images = function(name, tree){
	var img = new Image();

	if (tree !== undefined){
		img.src = kmBomber.imagePath + tree[name];
	} else {
		img.src = kmBomber.imagePath + kmBomber.images[name];
	}

	return img;
};


var Key = {
  pressed: {},
  SPACE: 32,
  ENTER: 13,
  
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
		kmBomber.context.clearRect(2, 2, 50, 50);
		kmBomber.context.fillText(fps, 2, 10);
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
	kmBomber.soundLoader(kmBomber.soundPath, kmBomber.tracks, function (){
		kmBomber.imgLoader(kmBomber.imagePath, kmBomber.images, function (){
			kmBomber.init();
		});
	});

});
