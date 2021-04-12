const { createMachine, interpret } = XState;

const helper = document.getElementById("helper");
const button = document.getElementsByTagName("button")[0];
//define the fsa
const zoomMachine = createMachine({
	id: "zoom",
	initial: "idle",
	context: {
		zoompercentage: 1,
	},
	states: {
		idle: {
			on: {
				mouseover: "hovering",
			},
		},
		hovering: {
			on: {
				mouseout: "idle",
				wheel: "zoom", 
			},
		},
		zoom: {
			//STILL NEED TO UPDATE THE VALUE AND THE TRANSITION FROM ZOOM TO 
			// HOVERING IS NOT LOGGED
			always: [
				{target: "hovering"} 
			]
		},
	},
});
//link the FSA to a service
const zoomService = interpret(zoomMachine).onTransition((state) => {
	const states = state.toStrings();
	console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});
//mouseover eventlistener
button.addEventListener("mouseover", (event) => {
	zoomService.send(event);
});
//mouseout event listener
button.addEventListener("mouseout", (event) => {
	zoomService.send(event);
});
//wheel event listener
button.addEventListener("wheel", (event) => {
	scale += event.deltaY * -0.01;
	// Restrict scale
	scale = Math.min(Math.max(.125, scale), 4);
	// Apply scale transform
	button.style.transform = `scale(${scale})`;
	zoomService.send(event);
});

let scale = 1;
//start the fsa
zoomService.start();
