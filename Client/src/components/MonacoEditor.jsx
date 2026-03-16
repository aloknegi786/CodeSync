import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { Awareness } from "y-protocols/awareness";
import { encodeAwarenessUpdate } from "y-protocols/awareness";
import { applyAwarenessUpdate } from "y-protocols/awareness";

import ACTIONS from '../Actions';
import LanguageSelector from './languageSelector';
import Run from './run';
import { CODE_SNIPPETS } from '../languageInfo';
import { auth } from '../lib/firebase.js';
import './remoteCursor.css';

const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"
  , "#DDA0DD", "#98D8C8", "#F7DC6F"
];

function getColorForClient(clientId) {
  return USER_COLORS[clientId % USER_COLORS.length];
}

const MonacoEditor = forwardRef(({
  socketRef, 
  roomId, 
  onCodeChange, 
  role, 
  setEditorInstance,
  setOutput, 
  setInput, 
  input, 
  output, 
  setError, 
  error, 
  isExecuting,
  setIsExecuting
}, ref) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Yjs Refs
  const ydocRef = useRef(new Y.Doc());
  const awarenessRef = useRef(null);
  const bindingRef = useRef(null);
  const remoteDecorationsRef = useRef([]);
  const decorationCollectionRef = useRef(null);

  const user = auth.currentUser;

  // UI State
  const [language, setLanguage] = useState("java");
  const [value, setValue] = useState(CODE_SNIPPETS[language]);
  const [fntSize, setFntsize] = useState("16px");
  const [tbSize, setTbsize] = useState("2 spaces");
  const [wordWrap, setWordWrap] = useState('off');
  const [isWordWrap, setIsWordWrap] = useState(false);
  const [loadedCode, setLoadedCode] = useState(null);

  const latestRole = useRef(role);
  const latestRoomId = useRef(roomId);

  useEffect(() => {
    latestRole.current = role;
    latestRoomId.current = roomId;
  }, [role, roomId]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco; // ✅ Save monaco reference
    setEditorInstance?.(editor);

    if (!socketRef?.current) return;

    editor.getModel().setEOL(monaco.editor.EndOfLineSequence.LF);

    if (editor.getValue() !== "") {
      editor.setValue("");
    }

    decorationCollectionRef.current = editor.createDecorationsCollection([]);

    // --- YJS BINDING ---
    const ydoc = ydocRef.current;
    const ytext = ydoc.getText('monaco');

    if (!awarenessRef.current) {
      awarenessRef.current = new Awareness(ydoc);
    }

    const awareness = awarenessRef.current;
    const userColor = getColorForClient(ydoc.clientID);
    const userName = user?.displayName || user?.email || socketRef.current.id.slice(0, 6);

    // Set local user info with color
    awareness.setLocalState({
      user: {
        name: userName,
        color: userColor,
        clientId: ydoc.clientID,
      },
      cursor: null,
      selection: null,
    });

    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      awareness
    );

    ydoc.on('update', (update, origin) => {
      setValue(ytext.toString());
      if (onCodeChange) onCodeChange(ytext.toString());

      if (origin !== 'network') {
        const currentRole = latestRole.current;
        if (currentRole === 'host' || currentRole === 'editor') {
          socketRef.current.emit('yjs_update', {
            roomId: latestRoomId.current,
            update
          });
        }
      }
    });

    // Track both cursor position AND selection
    editor.onDidChangeCursorSelection((e) => {
      const awareness = awarenessRef.current;
      if (!awareness) return;
      if(latestRole.current === "viewer" || latestRole.current === "pending") return;

      const { selection } = e;

      awareness.setLocalStateField("cursor", {
        line: selection.positionLineNumber,
        ch: selection.positionColumn,
      });

      // Only set selection if text is actually selected
      const hasSelection = !(
        selection.startLineNumber === selection.endLineNumber &&
        selection.startColumn === selection.endColumn
      );

      awareness.setLocalStateField("selection", hasSelection ? {
        anchor: { line: selection.startLineNumber, ch: selection.startColumn },
        head: { line: selection.endLineNumber, ch: selection.endColumn },
      } : null);
    });

    awareness.on("update", ({ added, updated, removed }, origin) => {
      if (origin === "network") return;

      const currentRole = latestRole.current;
      console.log(currentRole, "awareness update - added:", added, "updated:", updated, "removed:", removed);
      if (currentRole === "viewer" || currentRole === "pending") return;

      const changedClients = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(awareness, changedClients);

      socketRef.current.emit("awareness_update", {
        roomId: latestRoomId.current,
        update,
      });
    });

    awareness.on("change", () => {
      const monaco = monacoRef.current;
      if (!monaco || !editor) return;

      const states = Array.from(awareness.getStates().entries());
      const decorations = [];

      states.forEach(([clientId, state]) => {
        if (clientId === awareness.clientID) return; // Skip self
        if (!state.cursor && !state.selection) return;

        const color = state.user?.color || "#888";
        const name = state.user?.name || "User";

        // ✅ Inject per-user color style dynamically
        const styleId = `cursor-style-${clientId}`;
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
            .cursor-${clientId}::after {
              content: '';
              border-left: 2px solid ${color};
              height: 1.2em;
              position: absolute;
              left: 0;
              top: 0;
            }
            .cursor-label-${clientId}::before {
              content: '${CSS.escape(name)}';
              background: ${color};
              position: absolute;
              top: -18px;
              left: 0;
              font-size: 11px;
              font-weight: 600;
              padding: 1px 5px;
              border-radius: 3px;
              white-space: nowrap;
              color: #fff;
              pointer-events: none;
              z-index: 100;
            }
          `;
          document.head.appendChild(style);
        }

        if (state.cursor) {
          decorations.push({
            range: new monaco.Range(
              state.cursor.line,
              state.cursor.ch,
              state.cursor.line,
              state.cursor.ch,
            ),
            options: {
              className: `cursor-${clientId} cursor-label-${clientId}`,
              zIndex: 10,
            },
          });
        }

        // ✅ Selection highlight decoration
        if (state.selection) {
          decorations.push({
            range: new monaco.Range(
              state.selection.anchor.line,
              state.selection.anchor.ch,
              state.selection.head.line,
              state.selection.head.ch,
            ),
            options: {
              className: `remote-selection-${clientId}`,
              inlineClassName: `remote-selection-${clientId}`,
            },
          });

          // Inject selection highlight color
          const selStyleId = `sel-style-${clientId}`;
          if (!document.getElementById(selStyleId)) {
            const style = document.createElement("style");
            style.id = selStyleId;
            style.textContent = `
              .remote-selection-${clientId} {
                background: ${color}44 !important;
                border-radius: 2px;
              }
            `;
            document.head.appendChild(style);
          }
        }
      });

      // ✅ Use decoration collection set() instead of deltaDecorations
      decorationCollectionRef.current?.set(decorations);
    });

    socketRef.current.emit(ACTIONS.SYNC_CODE, {
      socketId: socketRef.current.id,
      roomId,
    });
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const ydoc = ydocRef.current;

    const handleInitialState = (stateVector) => {
      Y.applyUpdate(ydoc, new Uint8Array(stateVector), 'network');
    };

    const handleYjsUpdate = (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'network');
    };

    socketRef.current.on('yjs_initial_state', handleInitialState);
    socketRef.current.on('yjs_update', handleYjsUpdate);

    socketRef.current.on("awareness_update", ({ update }) => {
      const awareness = awarenessRef.current;
      if (!awareness) return;
      applyAwarenessUpdate(awareness, new Uint8Array(update), "network");
    });

    socketRef.current.on("language_updated", ({ language }) => {
      setLanguage(language);
      setLoadedCode(null);
      setOutput('');
      setError(false);
    });

    return () => {
      socketRef.current?.off('yjs_initial_state', handleInitialState);
      socketRef.current?.off('yjs_update', handleYjsUpdate);
      socketRef.current?.off("language_updated");
      socketRef.current?.off("awareness_update");
    };
  }, [socketRef]);

  useImperativeHandle(ref, () => ({
    setValue: (code) => {
      if (editorRef.current) editorRef.current.setValue(code);
    },
    getValue: () => editorRef.current?.getValue(),
    getInstance: () => editorRef.current,
    undo: () => editorRef.current?.trigger('keyboard', 'undo', null),
    redo: () => editorRef.current?.trigger('keyboard', 'redo', null),
    focus: () => editorRef.current?.focus(),
    scrollToLine: (line) => editorRef.current?.revealLineInCenter(line),
  }));

  function toggleWordWrap() {
    setIsWordWrap(!isWordWrap);
    setWordWrap(!isWordWrap ? 'on' : 'off');
  }

  function handleFontChange(fntSize) { setFntsize(fntSize); }
  function handleTabSizeChange(tbSize) { setTbsize(tbSize); }

  async function handleLanguageChange(languageSent, reset) {
    if (reset === "reset") setLoadedCode(null);
    if (languageSent === language || !socketRef?.current) return;

    socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
      language: languageSent,
      roomId,
    });
  }

  useEffect(() => {
    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <LanguageSelector
        language={language}
        handleLanguageChange={handleLanguageChange}
        fntSize={fntSize}
        handleFontChange={handleFontChange}
        tbSize={tbSize}
        handleTabSizeChange={handleTabSizeChange}
        isWordWrap={isWordWrap}
        toggleWordWrap={toggleWordWrap}
        editorRef={editorRef}
        loadedCode={loadedCode}
        input={input}
        output={output}
        error={error}
        setInput={setInput}
        value={value}
      />

      <Editor
        height="85%"
        theme="vs-dark"
        language={language}
        onMount={handleEditorDidMount}
        options={{
          readOnly: role === 'viewer' || role === 'pending',
          fontSize: fntSize,
          tabSize: parseInt(tbSize),
          wordWrap: wordWrap,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />

      {role === "host" && (
        <Run
          language={language}
          editorRef={editorRef}
          setOutput={setOutput}
          input={input}
          setError={setError}
          role={role}
          socketRef={socketRef}
          roomId={roomId}
          isExecuting={isExecuting}
          setIsExecuting={setIsExecuting}
        />
      )}
    </div>
  );
});

export default MonacoEditor;