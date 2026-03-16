import axios from 'axios';
import { LANGUAGE_INFO } from '../utils/languageInfo.js';

export async function executeCode(language, code, input) {
  try {
    const response = await axios.post(process.env.ONE_COMPILER_URL, {
      language,
      files: [
        {
          "name": LANGUAGE_INFO[language].file,
          "content": code
        }
      ],
      stdin: input
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ONE_COMPILER_API_KEY,
      },
      timeout: 9000 
    });
    const status = response.data.status;
    let output = "N/A";
    if(response.data?.stdout !== null && response.data?.stdout !== undefined) {
      output = response.data.stdout;
    }
    if(response.data?.stderr !== null && response.data?.stderr !== undefined) {
      output = response.data.stderr;
    }
    const isError = response.data?.error ? true : false;
    return {status,  output, isError };
  } catch (error) {
    throw new Error(`Error occurred while executing code: ${error.message}`);
  }
}