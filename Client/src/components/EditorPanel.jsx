import { Box } from "@chakra-ui/react";
import MonacoEditor from "./MonacoEditor";

function EditorPanel({ socketRef, roomId, role, handleSetEditor, handleSetCode, setOutput, input, setError, isLoading, setIsLoading }) {
  return (
    <div className="h-full w-full">
      <Box
        width="100%"
        height="100%"
        overflow="hidden"
        bg="gray.800"
        color="white"
      >
        {socketRef?.current && (
          <MonacoEditor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              handleSetCode(code);
            }}
            role={role}
            setEditorInstance={handleSetEditor}
            setOutput={setOutput}
            input={input}
            setError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </Box>
    </div>
  );
}

export default EditorPanel;