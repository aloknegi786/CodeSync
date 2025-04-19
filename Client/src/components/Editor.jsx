import React, { useEffect, useRef } from 'react'
import Codemirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/dracula.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/edit/closetag'
import 'codemirror/addon/edit/closebrackets'
import ACTIONS from '../Actions'

function Editor({socketRef, roomId, onCodeChange}) {
  const editorRef = useRef(null)
  const cmInstanceRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && !cmInstanceRef.current) {
      cmInstanceRef.current = Codemirror.fromTextArea(editorRef.current, {
        mode: { name: 'javascript', json: true },
        theme: 'dracula',
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      })
    }

    cmInstanceRef.current.on('change', (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if(origin !== 'setValue'){
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
    });
    

    // cmInstanceRef.current.setValue(`console.log('hello')`);

    // preventing the re-rendering of editor
    return () => {
      if (cmInstanceRef.current) {
        cmInstanceRef.current.toTextArea()
        cmInstanceRef.current = null
      }
    }
  }, [])

  useEffect(()=>{
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code != null && cmInstanceRef.current) {
          cmInstanceRef.current.setValue(code);
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    }
  },[socketRef.current]);

  return <textarea ref={editorRef} />
}

export default Editor
