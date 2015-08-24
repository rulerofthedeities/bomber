 function getPlane()
{
	var image = new Image(),
		status = "airborne",
		xStart = -102,
		yStart = 120;
	image.src = "assets/img/bomber.png";
	
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
		nrOfBombsLeft : 10,
		nrOfBombsDropped : 0,
		move: function(timeDelta, canvas){
		    if ((this.x) > canvas.width) {
		        this.x = this.xStart;
		    }
		    if ((this.y + this.img.height) >= canvas.height){
		    	this.status = "landed";
		    }

		    this.x += this.xSpeed * timeDelta;
		    this.y += this.ySpeed * timeDelta;
		},
		userActions: function(obj){
  			if (Key.isDown(Key.SPACE)){
  				var curTimeStamp = Math.floor(Date.now() / 100);
  				//Check if not just dropped bomb (reload time)
  				if (this.x > 0 && (this.x + this.img.width) < canvas.width && this.nrOfBombsLeft > 0 && curTimeStamp - this.lastTimeBombDropped > 6)
  				{
  					this.dropBomb(obj);
  					console.log("drop bomb (" + this.nrOfBombsLeft + " bombs left, " + this.nrOfBombsDropped + " dropped)");
  				}	
  			}
		},
		dropBomb: function (obj){
			this.nrOfBombsLeft--;
			this.nrOfBombsDropped++;
  			this.lastTimeBombDropped = Math.floor(Date.now() / 100);
  			var bomb = new Bomb(this.x + this.img.width / 2, this.y + this.img.height + 5, obj.bombs.length);
  			obj.bombs.push(bomb);
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
	this.imgHeight = 7;
	this.size = 1;//small bomb
	this.impact = Math.floor(Math.random() * 3) + this.size; //#of floors it damages
	this.img = new Image();
	var thisBomb = this;
	this.img.onload = function() {
			thisBomb.imgHeight = this.height;
		};
	this.img.src = "assets/img/bomb.png";
}

Bomb.prototype = {
	move: function(timeDelta, canvas){
		if (!this.active) return false;
	    if ((this.y + this.imgHeight) <= canvas.height){
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
		return this.y + this.imgHeight >= building.top;
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
		base.src = "assets/img/building" + this.nr + "_base.png";
		shaft = new Image();
		shaft.src = "assets/img/building" + this.nr + "_shaft.png";
		capital = new Image();
		capital.src = "assets/img/building" + this.nr + "_capital.png";
		broken = new Image();
		broken.src = "assets/img/building" + this.nr + "_broken.png";

		return {
			base: base, 
			shaft: shaft,
			capital: capital,
			broken: broken
		};
	},
	draw: function(ctx){
		var img = this.img(this.nr);
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
				if (this.floors <= 0){
					this.isDestroyed = true;
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

document.addEventListener("DOMContentLoaded", function(event)
{ 

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

	// initialize variables
	var canvas = document.getElementById('canvas'),
		context = canvas.getContext('2d'),
		objects = {
			plane: getPlane(),
			buildings: getBuildings(canvas),
			bombs : []
		},
		buildings,
		plane,
		indx = 0,
		timer = new Timer(),
		fps = document.getElementById('fps');


	function animate(nowTime, lastTime, objects) {
		
		plane = objects.plane;
		bombs = objects.bombs;
	    buildings = objects.buildings;

	    //show FPS
		timer.tick(Date.now());
		fps.innerHTML = timer.fps();


		//move plane
		plane.move(nowTime - lastTime, canvas);
		if (plane.hasCollided(buildings)){
			console.log("plane crashed");
			plane.status = "crashed";
		}
		plane.userActions(objects);
	    
		//move bombs
		for (indx = 0; indx < bombs.length; indx++){
			if (bombs[indx].move(nowTime - lastTime, canvas)){
				if (bombs[indx].hasCollided(buildings[bombs[indx].buildingNr])){
					buildings[bombs[indx].buildingNr].hit(bombs[indx]);
				}
			}
		}

	    // clear canvas
	    context.clearRect(0, plane.y - 1, canvas.width, canvas.height);

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
		        	animate(timestamp, nowTime, objects);
		        }
		    );
		}
	}

	animate(0, 0, objects);

	window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
	window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);
	
});
