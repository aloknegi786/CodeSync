import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import ACTIONS from '../Actions';
import LanguageSelector from './languageSelector';
import Run from './run';

const MonacoEditor = forwardRef(({ socketRef, roomId, onCodeChange, role, setEditorInstance, setOutput,setInput,input,output,setError,error, isLoading, setIsLoading}, ref) => {
  const editorRef = useRef(null);
  const [value,setValue]=useState('');
  const [language,setLanguage]=useState("java")
  const [fntSize,setFntsize]=useState("16px  ")
  const [tbSize,setTbsize]=useState("2 spaces");
  const [wordWrap,setWordWrap]=useState('off')
  const [isWordWrap,setIsWordWrap]=useState(false);
  const [loadedCode,setLoadedCode]=useState(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setEditorInstance?.(editor);
    socketRef.current.emit(ACTIONS.SYNC_CODE, {
      socketId: socketRef.current.id,
      roomId
    });
    editorRef.current.updateOptions({
      readOnly: role === 'viewer' || role === 'pending',
    });
  };

  const handleEditorChange = (value) => {
    if (value === undefined) return;

    if (role === 'host' || role === 'editor') {
      onCodeChange(value);
      socketRef.current.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        code: value,
      });
    }
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code != null && editorRef.current) {
          const model = editorRef.current.getModel();
          if (model.getValue() !== code) {
            const pos = editorRef.current.getPosition();
            editorRef.current.setValue(code);
            editorRef.current.setPosition(pos);
          }
        }
      });

      socketRef.current.on("language_updated", ({language})=> {
          setLanguage(language);
          setLoadedCode(null);
          setOutput('')
          setError(false)
      });
    }

    return () => {
      socketRef.current?.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  useEffect(() => {
    if (!editorRef.current) return;
      editorRef.current.updateOptions({
        readOnly: role === 'viewer' || role === 'pending',
      });
  }, [role, editorRef.current]);

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


  function toggleWordWrap(){
    if(isWordWrap){
      setIsWordWrap(false);
      setWordWrap('off');
    }
    else{
      setIsWordWrap(true);
      setWordWrap('on');
    }
  }

  function handleFontChange(fntSize){
    setFntsize(fntSize);
  }

  function handleTabSizeChange(tbSize){
    setTbsize(tbSize);
  }

  async function handleLanguageChange(languageSent,reset){
    if(reset === "reset"){
        setLoadedCode(null);
    }
    
    socketRef.current.emit("language_change", {
      language: languageSent,
      roomId,
    });
  }

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
        value={value}
        onMount={handleEditorDidMount}
        onChange={(value) => handleEditorChange(value)}
        options={{
          fontSize: fntSize,
          tabSize: tbSize,
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
