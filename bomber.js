function getPlane()
{
	var image = new Image(),
		status = "airborne",
		xStart = -102,
		yStart = 200;
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
		move : function(timeDelta, canvas){
		    if ((this.x) > canvas.width) {
		        this.x = this.xStart;
		    }
		    if ((this.y + this.img.height) >= canvas.height){
		    	this.status = "landed";
		    }

		    this.x += this.xSpeed * timeDelta;
		    this.y += this.ySpeed * timeDelta;
		},
		hasCollided : function(buildings){
			var noseX = Math.floor(this.x) + this.img.width,
				noseY = Math.floor(this.y) + this.img.height - 6,
				bellyX = Math.floor(this.x + this.img.width / 2),
				bellyY = Math.floor(this.y) + this.img.height,
				buildingNr = Math.floor(noseX / 30),
				building = buildings[buildingNr];
			//Check plane nose
			if (building){
				if (noseY > building.top){
					return true;
				}
			}
			//Check plane belly
			buildingNr = Math.floor(bellyX / 30);
			building = buildings[buildingNr];
			if (building){
				if (bellyY > building.top){
					return true;
				}
			}

			return false;
		}
	};
}

function Building(xPos, yPos, nr){
	this.x = xPos;
	this.y = yPos;
	this.nr = nr;
	this.maxFloors = 8;
	this.height = this.getHeight();
	this.top = yPos;
	this.status = "intact";
}

Building.prototype ={
	img : function() {
		base = new Image();
		base.src = "assets/img/building" + this.nr + "_base.png";
		shaft = new Image();
		shaft.src = "assets/img/building" + this.nr + "_shaft.png";
		capital = new Image();
		capital.src = "assets/img/building" + this.nr + "_capital.png";

		return {
			base: base, 
			shaft: shaft,
			capital: capital
		};
	},
	draw : function(ctx){
		var img = this.img(this.nr);
		ctx.drawImage(img.base, this.x, this.y-4);
		for (var indx = 1; indx <= this.height; indx++)
		{
			ctx.drawImage(img.shaft, this.x, this.y-4-20*indx);
		}
		ctx.drawImage(img.capital, this.x, this.y-7-20*(indx - 1));
		this.top = this.y-7-20*(indx - 1);
	},
	getHeight : function(){
		var canvasWidth = document.getElementById('canvas').width,
			divider = (canvasWidth / 2) / this.maxFloors,
			maxHeight = this.maxFloors - Math.trunc(Math.abs((this.x - canvasWidth/2) / divider));

		return Math.floor((Math.random() * maxHeight) + 1);
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

document.addEventListener("DOMContentLoaded", function(event)
{ 

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

	// initialize variables
	var canvas = document.getElementById('canvas'),
		context = canvas.getContext('2d'),
		objects = {
			plane: getPlane(),
			buildings: getBuildings(canvas)
		},
		buildings,
		plane;

	function animate(nowTime, lastTime, objects) {
		
		plane = objects.plane;
	    buildings = objects.buildings;

		//move plane
		plane.move(nowTime - lastTime, canvas);
		if (plane.hasCollided(buildings)){
			console.log("plane crashed");
			plane.status = "crashed";
		}
	    
	    // clear canvas
	    context.clearRect(0, 0, canvas.width, canvas.height);

	    //draw objects
	    for (var indx = 0; indx < buildings.length; indx++)
	    {
	    	buildings[indx].draw(context);
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
});
