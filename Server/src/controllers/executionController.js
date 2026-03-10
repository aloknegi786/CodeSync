import { executeCode } from "../runner/executeCode.js";

export const runCode = async (language, code, input) => {
  console.log("Running code with params: ", { language, code, input });
  const output = await executeCode(language, code, input);

  return output;
};