# Zooming

## How to use

1. Create a file called `config.js` under the repository folder.
2. Paste the following content into `config.js` and replace `your.mapbox.access.token` with your [Mapbox](https://www.mapbox.com/) access token:
```javascript
const ACCESS_TOKEN = "your.mapbox.access.token";
```
3. Open `index.html` in your browser.
4. Open the console and see the state transitions as they happen.

## Known issues

- When the statechart tries to update the zoom level in its context, the zoom level of the underlying map is still old. In other words, the update of the underlying zoom level takes some time, but the statechart needs that information as soon as it receives a wheel event.
