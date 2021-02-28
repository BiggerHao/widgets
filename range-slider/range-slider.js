const slider = document.getElementById("slider");

noUiSlider.create(slider, {
  start: [0, 10],
  behaviour: "drag-unconstrained-tap",
  connect: true,
  tooltips: [
    {
      to: function (value) {
        return "[A] " + value.toFixed(2);
      },
    },
    {
      to: function (value) {
        return "[B] " + value.toFixed(2);
      },
    },
  ],
  range: {
    min: 0,
    max: 10,
  },
  step: 1,
});
