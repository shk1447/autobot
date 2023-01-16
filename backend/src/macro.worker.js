const robot = require("@jitsi/robotjs");
const workerpool = require("workerpool");
const keycode = require("keycode");
const { wait } = require("./utils");

/*

160 shift
161 right shift
162 ctrl
164 alt

21 한영키 (right alt) 
25 한자 (right control)
44 print screen

*/

const missingKey = {
  160: "shift",
  161: "shift",
  162: "control",
  164: "alt",
  // 한영전환 기능 필요...
  21: "right alt",
  25: "right control",
  44: "print",
  91: "command",
  93: "right command",
};

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
        wait(0.1);
        const clickType =
          hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
        robot.mouseToggle("down", clickType);

        break;
      }
      case "mouseup": {
        wait(0.1);
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

        let key;
        if (missingKey[hook.rawcode]) {
          key = missingKey[hook.rawcode];
        } else {
          key = keycode(hook.rawcode);
        }

        console.log(key);
        try {
          robot.keyToggle(key, "up", modifier);
        } catch (error) {
          console.warn(`missing key ${key} : ${hook.rawcode}`);
        }
        break;
      }
      case "keydown": {
        wait(0.05);

        const modifier = [];

        if (hook.shiftKey) modifier.push("shift");
        if (hook.altKey) modifier.push("alt");
        if (hook.ctrlKey) modifier.push("control");
        if (hook.metaKey) modifier.push("command");

        let key;
        if (missingKey[hook.rawcode]) {
          key = missingKey[hook.rawcode];
        } else {
          key = keycode(hook.rawcode);
        }

        console.log(key);
        try {
          robot.keyToggle(key, "down", modifier);
        } catch (error) {
          console.warn(`missing key ${key} : ${hook.rawcode}`);
        }
        break;
      }
    }
  }
  return true;
};
workerpool.worker({
  startMacro: startMacro,
});
