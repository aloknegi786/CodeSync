import { spawn } from "child_process";
import fs from "fs/promises";
import { v4 as uuid } from "uuid";
import path from "path";

export async function executeCode(language, code, input = "") {
  const id = uuid();

  const executionsRoot = path.resolve("src/runner/executions");
  const dir = path.join(executionsRoot, id);

  await fs.mkdir(dir, { recursive: true });

  let fileName;
  let dockerImage;
  let runCommand;

  if (language === "cpp") {
    fileName = "main.cpp";
    dockerImage = "gcc";
    runCommand = "g++ main.cpp -o main && ./main";
  }

  if (language === "python") {
    fileName = "main.py";
    dockerImage = "python:3";
    runCommand = "python main.py";
  }

  if (language === "javascript") {
    fileName = "main.js";
    dockerImage = "node";
    runCommand = "node main.js";
  }

  if (language === "java") {
    fileName = "Main.java";
    dockerImage = "eclipse-temurin:21";
    runCommand = "javac Main.java && java Main";
  }

  if(language == "c") {
    fileName = "main.c";
    dockerImage = "gcc";
    runCommand = "gcc main.c -o main && ./main";
  }

  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, code, "utf8");

  const hostPath = dir.replace(/\\/g, "/");

  const args = [
    "run",
    "--rm",
    "-m", "256m",
    "--cpus", "1",
    "--network", "none",
    "--pids-limit", "64",
    "-v", `${hostPath}:/code`,
    "-w", "/code",
    dockerImage,
    "sh",
    "-c",
    runCommand
  ];

  console.log("Execution folder:", dir);
  console.log("Files:", await fs.readdir(dir));
  console.log("Docker args:", args);

  return new Promise((resolve) => {

    const proc = spawn("docker", args, {
      env: {
        ...process.env,
        MSYS_NO_PATHCONV: "1"
      }
    });

    let output = "";
    let error = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      error += data.toString();
    });

    proc.on("close", async () => {


      await fs.rm(dir, { recursive: true, force: true });

      resolve((output || error).trim());
    });

  });
}