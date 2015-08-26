var kmBomber = {
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
		}
	},
	soundPath: 'assets/sound/',
	tracks: {
		explosion : "explosion.wav"
	}
};

kmBomber.init = function() {
    kmBomber.canvas = document.getElementById("canvas");
	kmBomber.context = kmBomber.canvas.getContext("2d");
	kmBomber.objects = {
		plane: getPlane(),
		buildings: getBuildings(kmBomber.canvas),
		bombs : []
	};
	kmBomber.hud = new HUD();
	kmBomber.timer = new Timer();
	kmBomber.fps = document.getElementById('fps');
	kmBomber.player = new Player();
	kmBomber.hud.init();
	kmBomber.canvas.setAttribute('tabindex','0');
	kmBomber.canvas.focus();
	var expl = kmBomber.objects.buildings[0].sound().explosion;	
	kmBomber.run();
};

kmBomber.run = function(nowTime, lastTime) {
		
	plane = kmBomber.objects.plane;
	bombs = kmBomber.objects.bombs;
    buildings = kmBomber.objects.buildings;
    canvas = kmBomber.canvas;
    context = kmBomber.context;

    //show FPS
	kmBomber.timer.tick(Date.now());
	kmBomber.fps.innerHTML = kmBomber.timer.fps();

	//move plane
	plane.move(nowTime - lastTime, canvas);
	if (plane.hasCollided(buildings)){
		console.log("plane crashed");
		plane.status = "crashed";
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

	for (indx = 0; indx < bombs.length; indx++){
		bombs[indx].draw(context);
	}
    context.drawImage(plane.img, plane.x, plane.y);
	
    if (plane.status === "airborne"){
	    requestAnimationFrame(
	        function(timestamp){
	        	kmBomber.run(timestamp, nowTime);
	        }
	    );
	}
};



function Player(){
	this.name = '';
	this.hiScore = 0;
	this.timesPlayed = 0;
	this.level = 1;
	this.score = 0;
}

Player.prototype.update = function(obj) {
	if (Key.isDown(Key.SPACE)){
		obj.plane.tryBombDrop(obj.bombs);
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
	this.scoreRange = {x: 494, y:10, w:200, h:50};
}

HUD.prototype.init = function(){
	this.context.font = "26px Verdana";
	this.context.textBaseline = "top";
	this.context.fillText("Score: ", this.bombRange.x, this.scoreRange.y);
	this.updateBombs(kmBomber.objects.plane);
	this.updateScore(kmBomber.player);
};

HUD.prototype.updateBombs = function(plane){
	this.context.clearRect(this.bombRange.x, this.bombRange.y, this.bombRange.w, this.bombRange.h);
	for (var i = 0; i < plane.nrOfBombsLeft; i++){
		this.context.drawImage(this.bombImg, this.bombRange.x + (i % this.bombsPerRow) * 9, this.bombRange.y + Math.floor(i / this.bombsPerRow) *20 );
	}
};

HUD.prototype.updateScore = function(player){
	this.context.clearRect(this.scoreRange.x, this.scoreRange.y, this.scoreRange.w, this.scoreRange.h);
	this.context.fillText(this.pad(player.score.toString(), 6), this.scoreRange.x, this.scoreRange.y);
};

	var cnt = 0;

HUD.prototype.pad = function(str, max) {
  return str.length < max ? this.pad("0" + str, max) : str;
};

function getPlane()
{
	var image = new Image(),
		status = "airborne",
		xStart = -102,
		yStart = 70;
	image.src = kmBomber.imagePath + kmBomber.images.plane;
	
	return {
		xSpeed : 0.07,  //px per ms
		ySpeed : 0.005,
		xStart : xStart,
		yStart : yStart,
		x : xStart,
		y : yStart,
		img : image,
		status : status,
		lastTimeBombDropped : 0,
		nrOfBombsLeft : 40,
		nrOfBombsDropped : 0,
		move: function(timeDelta, canvas){
		    if (this.x > canvas.width) {
		        this.x = this.xStart;
		    }
		    if ((this.y + this.img.height) >= canvas.height){
		    	this.status = "landed";
		    }
		    this.x += this.xSpeed * (timeDelta || 0);
		    this.y += this.ySpeed * (timeDelta || 0);
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
				if (noseY > building.top){
					return true;
				}
			}
			//Check plane belly
			building = buildings[Math.floor(bellyX / 30)];
			if (building){
				if (bellyY > building.top){
					return true;
				}
			}

			return false;
		}
	};
}

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
		return this.y + this.img.height >= building.top;
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
	sound: function(){
		var explosion = new Audio(kmBomber.soundPath + kmBomber.tracks.explosion);

		return {
			explosion: explosion
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
			minFloors = Math.floor(maxFloors / 4) + 1;

		return Math.floor(Math.random() * maxFloors + minFloors);
	},
	hit: function(bomb){
		if (this.toDestroy > 0){ // buffers automatically when created
			this.sound().explosion.play();
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


function getBuildings(canvas)
{
	var buildings = [],
		maxHeight,
		maxWidth;

	maxWidth = canvas.width;
	for (var indx = 0; indx < 20; indx++){
		buildings[indx] = new Building(30 * indx, 400, 1);
	}

	return buildings;
}

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
			console.log("Error loading file '" + imgPath + imgSrc + "'");
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


/*
	expl.canplay = function() {
   		alert("Browser has loaded the current frame");
		expl.play();
	};
*/

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
