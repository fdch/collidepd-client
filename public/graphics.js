paper.install(window);

window.onload = function() {
	paper.setup('cnv');
	// view.onResize = function(event) {
	// 	// Whenever the window is resized, recenter the path:
	// 	path.position = view.center;
  	// }
}
class Visualizer {
	constructor(idx) {
		this.state = idx;
		this.path = new Path();
		this.radius = 10;
		this.zcolor = idx.oscid / 255.;
		this.color = new Color(Math.random(),Math.random(),this.zcolor);
		this.path.strokeColor = this.color;
		// console.log("visualizer initialized", this.state);
	}
	draw(x,y) {
		let p = new Point((x-60)/5000*view.viewSize.width, (1-((y-60)/5000))*view.viewSize.height);
		this.path = new Path.Circle({
			center: p,
			radius: this.radius,
			strokeColor: this.color
		});
	}
	strokeColor(x,y) {
		this.color = new Color(x,y,this.zcolor);
	}
	strokeRadius(z) {
		this.radius = z * 20;
	}
};
