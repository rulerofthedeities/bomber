function getPlane()
{
	//var image = new Image();
	var image = document.createElement("img");
	image.src = "assets/img/bomber.png";
	return {
		xSpeed : 0.07,  //px per ms
		ySpeed : 0.005,
		xStart : -102,
		yStart : 50,
		img : image
	};
}

function Building(xPos, yPos, nr){
	this.x = xPos;
	this.y = yPos;
	this.nr = nr;
	this.maxFloors = 8;
	this.height = this.getHeight();
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
	},
	getHeight : function(){
		var canvasWidth = document.getElementById('canvas').width,
			divider = (canvasWidth / 2) / this.maxFloors,
			maxHeight = this.maxFloors - Math.trunc(Math.abs((this.x - canvasWidth/2) / divider));

		return Math.floor((Math.random() * maxHeight) + 1);
	}
};


function getBuildings()
{
	var canvas = document.getElementById('canvas'),
		buildings = [],
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

	// get canvas and create drawing context
	var canvas = document.getElementById('canvas'),
		context = canvas.getContext('2d'),
		objects = {
			plane: getPlane(),
			buildings: getBuildings()
		},
		stopPlane = false;

	function animate(nowTime, lastTime, xPos, yPos, objects) {
		
		plane = objects.plane;
	    if ((xPos) > canvas.width) {
	        xPos = plane.xStart;
	    }
	    if ((yPos + plane.img.height) >= canvas.height){
	    	stopPlane = true;
	    }
	    
	    var timeDelta = nowTime - lastTime;
	    var xDelta = plane.xSpeed * timeDelta;
	    var yDelta = plane.ySpeed * timeDelta;
	    
	    // clear canvas
	    context.clearRect(0, 0, canvas.width, canvas.height);

	    //draw objects
	    for (var indx = 0; indx < objects.buildings.length; indx++)
	    {
	    	objects.buildings[indx].draw(context);
	    }
	    context.drawImage(plane.img, xPos, yPos);
		
	    if (stopPlane !== true){
		    requestAnimationFrame(
		        function(timestamp){
		        	animate(timestamp, nowTime, xPos + xDelta, yPos + yDelta, objects);
		        }
		    );
		}
	}

	animate(0, 0, objects.plane.xStart, objects.plane.yStart, objects);
});