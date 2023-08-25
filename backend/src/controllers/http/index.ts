import express from "express";
import swaggerUi from "swagger-ui-express";
import { RegisterRoutes } from "./routes";
import path from "path";
import { app as electronApp } from "electron";
export class HttpController {
  constructor(host: string = "0.0.0.0", port: number = 8282) {
    const app = express();

    app.use(
      "/public",
      express.static(path.join(electronApp.getAppPath(), "../app/public"))
    );
    app.use("/userData", express.static(electronApp.getPath("userData")));
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(undefined, {
        swaggerOptions: {
          url: "/public/swagger.json",
        },
      })
    );

    RegisterRoutes(app);

    app
      .listen(port, host, () => {
        console.log("server process");
      })
      .on("error", (err) => {
        console.log(err);
      });
  }
}
