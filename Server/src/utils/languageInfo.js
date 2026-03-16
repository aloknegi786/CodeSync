export const LANGUAGE_VERSIONS = {
  c: "gcc 13",
  cpp: "gcc 13",
  java: "21",
  javascript: "node 22",
  python: "3.12",
};

export const CODE_SNIPPETS = {
  javascript: `function welcome() {
\tconsole.log("Welcome to CodeSync!");
}

welcome();
`,

  python: `def welcome():
\tprint("Welcome to CodeSync!")

welcome()
`,

  java: `import java.util.*;
import java.io.*;

public class Main {
\tpublic static void main(String[] args) {
\t\tSystem.out.println("Welcome to CodeSync!");
\t}
}
`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
\tcout << "Welcome to CodeSync!" << endl;
\treturn 0;
}
`,

  c: `#include <stdio.h>

int main() {
\tprintf("Welcome to CodeSync!");
\treturn 0;
}
`,
};

export const LANGUAGE_INFO = {
  cpp: {
    file: "main.cpp",
    version: "C++ (GCC 13)",
    description:
      "Compiled using GCC inside a Docker container. STL containers like std::set and std::map are available.",
  },

  c: {
    file: "main.c",
    version: "C (GCC 13)",
    description:
      "Compiled using GCC inside an isolated Docker container environment.",
  },

  java: {
    file: "Main.java",
    version: "Java (Temurin 21)",
    description:
      "Executed using Eclipse Temurin JDK 21 inside a Docker container.",
  },

  javascript: {
    file: "main.js",
    version: "JavaScript (Node.js 22)",
    description:
      "Executed using Node.js runtime inside a Docker container.",
  },

  python: {
    file: "main.py",
    version: "Python (3.12)",
    description:
      "Executed using Python 3 inside a Docker container environment.",
  },
};

export const FONT_SIZE = [
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "17px",
  "18px",
  "19px",
  "20px",
  "21px",
  "22px",
  "23px",
  "24px",
];

export const TAB_SPACES = ["2 spaces", "4 spaces"];

export const LANGUAGE_ICONS = {
  c: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg",
  cpp: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg",
  java: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
  javascript:
    "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
  python:
    "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
};