# Crossfilter

An example of how the widget models could be applied to create the state chart of a complex, real visualization like crossfilter.

## How to use

To start up a development server:

1. Run `yarn` to install dependencies.
2. Run `yarn run start:flights` to start the app.
3. Open http://localhost:1234.

To build a production version of the application:

1. Run `yarn` to install dependencies.
2. Run `yarn run build:flights` to build. The output files will be placed under the `dist` folder.

To generate state transition probabilities based on existing events:

1. Run `yarn` to install dependencies.
2. Run `build:transition` and `build:probability` to build the state transition generator and the transition probability generator, respectively.
3. Run `node ./transition-generator/build/generate_transitions.js` to generate state transitions.
4. Run `node ./transition-generator/build/generate_probabilities.js` to generate transition probabilities.

## Live demo

A live demo can be found on [GitHub Pages](https://biggerhao.github.io/widgets/crossfilter/).

## Known issues

1. Resetting brushes by double clicking is not supported.

## Acknowledgment

Part of the code is from [XStateVisualization](https://github.com/GiovFiordeponti/XStateVisualization).
