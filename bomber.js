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

document.addEventListener("DOMContentLoaded", function(event)
{ 

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

	// get canvas and create drawing context
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');

	// create image
	var stop = false;

	function animate(nowTime, lastTime, xPos, yPos, plane) {
		
	    if ((plane.img.width + xPos) > canvas.width) {
	        xPos = plane.xStart;
	    }
	    if ((yPos + plane.img.height) >= canvas.height){
	    	stop = true;
	    }
	    
	    var timeDelta = nowTime - lastTime;
	    var xDelta = plane.xSpeed * timeDelta;
	    var yDelta = plane.ySpeed * timeDelta;
	    
	    // clear
	    context.clearRect(0, 0, canvas.width, canvas.height);

	    //draw img
	    context.drawImage(plane.img, xPos, yPos);

	    if (stop !== true){
		    requestAnimationFrame(
		        function(timestamp){
		        	animate(timestamp, nowTime, xPos + xDelta, yPos + yDelta, plane);
		        }
		    );
		}
	}

	var plane = getPlane();
	animate(0, 0, plane.xStart, plane.yStart, plane);
});