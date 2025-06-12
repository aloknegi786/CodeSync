import React, { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import ACTIONS from '../Actions';
import { useMyPresence, useOthers } from '@liveblocks/react';

function MonacoEditor({ socketRef, roomId, onCodeChange, role }) {
  const editorRef = useRef(null);
  const monacoInstance = useMonaco();
  const [_, setPresence] = useMyPresence();
  const others = useOthers();

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.onDidChangeModelContent((event) => {
      const code = editor.getValue();
      onCodeChange(code);

      if (role === 'host' || role === 'editor') {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code,
        });

        const position = editor.getPosition();
        setPresence({ cursor: position, isTyping: true });

        clearTimeout(window._typingTimeout);
        window._typingTimeout = setTimeout(() => {
          setPresence({ cursor: null, isTyping: false });
        }, 2000);
      }
    });

    editor.onDidChangeCursorPosition(() => {
      const position = editor.getPosition();
      setPresence({ cursor: position, isTyping: true });

      clearTimeout(window._typingTimeout);
      window._typingTimeout = setTimeout(() => {
        setPresence({ cursor: null, isTyping: false });
      }, 2000);
    });
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code != null && editorRef.current) {
          const model = editorRef.current.getModel();
          if (model.getValue() !== code) {
            editorRef.current.setValue(code);
          }
        }
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
  }, [role]);

  return (
    <div className="w-full h-full relative">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// Start coding..."
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    </div>
  );
}

export default MonacoEditor;
