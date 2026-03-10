import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';

import ACTIONS from '../Actions';
import LanguageSelector from './languageSelector';
import Run from './run';
import { CODE_SNIPPETS } from '../languageInfo';

const MonacoEditor = forwardRef(({ 
  socketRef, roomId, onCodeChange, role, setEditorInstance, 
  setOutput, setInput, input, output, setError, error, isLoading, setIsLoading
}, ref) => {
  const editorRef = useRef(null);
  
  // Yjs Refs
  const ydocRef = useRef(new Y.Doc());
  const bindingRef = useRef(null);

  // UI State
  const [language, setLanguage] = useState("java");
  const [value, setValue] = useState(CODE_SNIPPETS[language]); // Kept for LanguageSelector
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
    setEditorInstance?.(editor);

    if (!socketRef?.current) return;

    // 🔴 FIX 1: Normalize Line Endings (The EOL Bug) 
    // This forces Monaco to treat all line breaks as a single '\n' character,
    // ensuring the math perfectly matches across Windows, Mac, and the backend.
    editor.getModel().setEOL(monaco.editor.EndOfLineSequence.LF);

    // 🔴 FIX 2: Prevent Double Initialization
    // If the editor accidentally mounted with local text, clear it.
    // The backend is the single source of truth and will provide the text via SYNC_CODE.
    if (editor.getValue() !== "") {
      editor.setValue(""); 
    }

    // --- YJS BINDING ---
    const ydoc = ydocRef.current;
    const ytext = ydoc.getText('monaco');

    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      ydoc.awareness
    );

    // Broadcast local changes to the network
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

    // Request initial sync data from the backend
    socketRef.current.emit(ACTIONS.SYNC_CODE, {
      socketId: socketRef.current.id,
      roomId
    });
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const ydoc = ydocRef.current;

    // --- YJS SOCKET LISTENERS ---
    const handleInitialState = (stateVector) => {
      // Apply the update and label it as coming from the 'network' (prevents rebroadcasting)
      Y.applyUpdate(ydoc, new Uint8Array(stateVector), 'network');
    };

    const handleYjsUpdate = (update) => {
      // Apply the update and label it as coming from the 'network' (prevents rebroadcasting)
      Y.applyUpdate(ydoc, new Uint8Array(update), 'network');
    };

    socketRef.current.on('yjs_initial_state', handleInitialState);
    socketRef.current.on('yjs_update', handleYjsUpdate);

    // Language sync
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
    };
  }, [socketRef]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    setValue: (code) => {
      // Yjs automatically intercepts this and syncs it!
      if (editorRef.current) editorRef.current.setValue(code);
    },
    getValue: () => editorRef.current?.getValue(),
    getInstance: () => editorRef.current,
    undo: () => editorRef.current?.trigger('keyboard', 'undo', null),
    redo: () => editorRef.current?.trigger('keyboard', 'redo', null),
    focus: () => editorRef.current?.focus(),
    scrollToLine: (line) => editorRef.current?.revealLineInCenter(line),
  }));

  // --- UI Handlers ---
  function toggleWordWrap() {
    setIsWordWrap(!isWordWrap);
    setWordWrap(!isWordWrap ? 'on' : 'off');
  }

  function handleFontChange(fntSize) { setFntsize(fntSize); }
  function handleTabSizeChange(tbSize) { setTbsize(tbSize); }

  async function handleLanguageChange(languageSent, reset) {
    if (reset === "reset") setLoadedCode(null);
    if (languageSent === language || !socketRef?.current) return;
    
    // Note: The backend handles inserting the new boilerplate snippet via Yjs
    socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
      language: languageSent,
      roomId,
    });
  }

  // Cleanup binding on unmount
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
        value={value} // Fed by ytext.toString() now
      />

      <Editor
        height="85%"
        theme="vs-dark"
        language={language}
        // REMOVED 'value' and 'onChange' - MonacoBinding handles this internally
        onMount={handleEditorDidMount}
        options={{
          readOnly: role === 'viewer' || role === 'pending',
          fontSize: fntSize,
          tabSize: parseInt(tbSize), // Ensure this is a number for Monaco
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
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}
    </div>
  );
});

export default MonacoEditor;