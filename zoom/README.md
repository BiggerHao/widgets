# Zoom

Very simple zoom model, with its html/javascript/xstate implementation.

## Limitations

XState has a limitation that is clearly pointed out by this example: eventless transitions (expressed with the keyword "always" in the machine's jason) are not triggering onTransition, thus are not logged.
To overcome this issues, I implemented an event-triggered transition to go exit the "zoom" state while triggering the logging operations, even if this is not ideal.


### How to use

1. Run a server on your machine (e.g., using the command "python -m http.server" from this folder.
2. Open `http://localhost:8000/index.html` in your browser.
3. Open the console and see the state transitions as they happen.
