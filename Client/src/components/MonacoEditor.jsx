import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import ACTIONS from '../Actions';

const MonacoEditor = forwardRef(({ socketRef, roomId, onCodeChange, role, setEditorInstance  }, ref) => {
  const editorRef = useRef(null);
  const monacoInstance = useMonaco();

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setEditorInstance?.(editor);
  };

  const handleEditorChange = (value) => {
    // console.log("code: ", value);
    if (value === undefined) return;

    onCodeChange(value);

    if (role === 'host' || role === 'editor') {
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
    }
    return () => {
      socketRef.current?.off(ACTIONS.CODE_CHANGE);
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({
      readOnly: role === 'viewer' || role === 'pending',
    });
  }, [role]);

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

  return (
    <div className="w-full h-full relative">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// Start coding..."
        theme="vs-dark"
        onMount={handleEditorDidMount}
        onChange={(value) => {
          handleEditorChange(value);
        }}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    </div>
  );
});

export default MonacoEditor;
