import axios from "axios";
import { LANGUAGE_VERSIONS } from "../utils/languageInfo.js";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export async function executeCode(language, code, input) {
  try {
    const response = await API.post("/execute", {
      language,
      version: LANGUAGE_VERSIONS[language],
      files: [
        {
          content: code,
        },
      ],
      stdin: input,
    });

    return response.data;
  } catch (err) {
    console.error("Execution failed:", err);
    return { run: { stderr: "Execution error" } };
  }
}
