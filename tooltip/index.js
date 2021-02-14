function initTooltip() {
  const button = document.getElementById("button");
  const tooltip = document.getElementById("tooltip");
  let onWidget = false;
  let tooltipVisible = false;
  let mousemoveTimer;

  button.addEventListener("mouseenter", function () {
    onWidget = true;
    tooltipService.send("ENTER_WIDGET");
  });

  button.addEventListener("mouseleave", function () {
    onWidget = false;
    clearTimeout(mousemoveTimer);
    tooltip.style.visibility = "hidden";
    tooltipVisible = false;
    tooltipService.send("LEAVE_WIDGET");
  });

  button.addEventListener("mousemove", function (event) {
    tooltipService.send("MOUSE_MOVE");
    clearTimeout(mousemoveTimer);
    if (onWidget && !tooltipVisible) {
      mousemoveTimer = setTimeout(() => {
        tooltip.style.visibility = "visible";
        tooltip.style.top = event.clientY + "px";
        tooltip.style.left = event.clientX + "px";
        tooltipVisible = true;
        tooltipService.send("STOP_MOVING");
      }, 200);
    }
  });

  tooltipService.start();

  // Initialize the state chart.
  if (button.matches(":hover")) {
    tooltipService.send("ENTER_WIDGET");
  } else {
    tooltipService.send("LEAVE_WIDGET");
  }
}

initTooltip();
