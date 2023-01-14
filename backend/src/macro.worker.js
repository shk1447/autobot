const robot = require("@jitsi/robotjs");
const workerpool = require("workerpool");
const { wait } = require("./utils");

const startMacro = (args) => {
  const { hooks } = args;
  const clicks = hooks.filter((d) => d.type == "mousedown");
  hooks.splice(hooks.indexOf(clicks[clicks.length - 1]), 3);
  for (var hook of hooks) {
    switch (hook.type) {
      case "mousemove": {
        wait(0.0002);
        robot.moveMouse(hook.x, hook.y);
        break;
      }
      case "mousewheel": {
        wait(0.1);
        robot.scrollMouse(0, -hook.rotation * hook.amount * 40);
        break;
      }
      case "mouseclick": {
        // wait(0.4);
        // const clickType =
        //   hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
        // robot.mouseClick(clickType);
        break;
      }
      case "mousedown": {
        wait(0.4);
        const clickType =
          hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
        robot.mouseToggle("down", clickType);

        break;
      }
      case "mouseup": {
        wait(0.4);
        const clickType =
          hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
        robot.mouseToggle("up", clickType);
        break;
      }
      case "mousedrag": {
        wait(0.0002);
        robot.dragMouse(hook.x, hook.y);
        break;
      }
      case "keyup": {
        wait(0.0002);
        if (hook.shiftKey || hook.altKey || hook.ctrlKey || hook.metaKey) {
          console.log("short cut!!! gogo");
        } else {
          const text = String.fromCharCode(hook.rawcode);
          robot.typeString(text.toLowerCase());
        }
        break;
      }
      case "keydown": {
        break;
      }
    }
  }
  return true;
};
workerpool.worker({
  startMacro: startMacro,
});
