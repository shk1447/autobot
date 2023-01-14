const robot = require("@jitsi/robotjs");
const workerpool = require("workerpool");
const keycode = require("keycode");
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
        wait(0.05);

        const modifier = [];

        if (hook.shiftKey) modifier.push("shift");
        if (hook.altKey) modifier.push("alt");
        if (hook.ctrlKey) modifier.push("control");
        if (hook.metaKey) modifier.push("command");

        const key = keycode(hook.rawcode);
        // console.log(key);
        robot.keyToggle(key, "up", modifier);

        // if (hook.shiftKey || hook.altKey || hook.ctrlKey || hook.metaKey) {
        //   console.log("short cut!!! gogo");
        //   //robot.keyTap
        // } else {
        //   const text = String.fromCharCode(hook.rawcode);
        //   robot.typeString(text.toLowerCase());
        // }
        break;
      }
      case "keydown": {
        wait(0.05);

        const modifier = [];

        if (hook.shiftKey) modifier.push("shift");
        if (hook.altKey) modifier.push("alt");
        if (hook.ctrlKey) modifier.push("control");
        if (hook.metaKey) modifier.push("command");

        let key = keycode(hook.rawcode);
        console.log(key);
        if (key.includes("command")) key = "command";

        robot.keyToggle(key, "down", modifier);
        break;
      }
    }
  }
  return true;
};
workerpool.worker({
  startMacro: startMacro,
});

/*

160 shift
161 right shift

162 ctrl
164 alt

21 한영키 (right alt)


25 한자 (right control)


44 print screen

*/
