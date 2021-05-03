const { createMachine, assign, interpret } = XState;

const helper = document.getElementById("helper");
const button = document.getElementsByTagName("button")[0];

button.style.transform = "scale(1)";

const updateValue = context => button.style.transform;

//define the fsa
const zoomMachine = createMachine({
	id: "zoom",
	initial: "idle",
	context:{
		zoomValue: button.style.transform
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
			on: {
				UPDATE: { actions: assign({ zoomValue: updateValue }) },
				DONE: "hovering",
			},
		},
	},
});

//link the FSA to a service
const zoomService = interpret(zoomMachine)
	.onTransition((state) => {
		const states = state.toStrings();
		state.context.zoomValue == button.style.transform;
		console.log(`\t${states[0]}\t\t\t${state.event.type}\t\t\t` + state.context.zoomValue);
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
	zoomService.send("UPDATE");
	zoomService.send("DONE");
});

let scale = 1;
//start the fsa
zoomService.start();
