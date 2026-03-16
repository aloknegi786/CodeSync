import { executeCode } from "./../runner/executeCodeOneCompiler.js";

export const runCode = async (language, code, input) => {
  const output = await executeCode(language, code, input);
  return output;
};