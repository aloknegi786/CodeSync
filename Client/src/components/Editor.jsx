import React, { useEffect, useRef } from 'react'
import Codemirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/dracula.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/edit/closetag'
import 'codemirror/addon/edit/closebrackets'

function Editor() {
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

    // preventing the re-rendering of editor
    return () => {
      if (cmInstanceRef.current) {
        cmInstanceRef.current.toTextArea()
        cmInstanceRef.current = null
      }
    }
  }, [])

  return <textarea ref={editorRef} />
}

export default Editor
