import { useEffect } from "react";
import ACTIONS from "../Actions";

export default function useEditorSync({
  socketRef,
  setInput,
  setOutput,
  setError,
  setIsExecuting,
}) {

  useEffect(() => {

    if (!socketRef.current) return;

    socketRef.current.on(ACTIONS.INPUT_CHANGE, ({ newInput }) => {
      setInput(newInput);
    });

    socketRef.current.on(ACTIONS.OUTPUT_CHANGE, ({ output, isError }) => {
      setOutput(output);
      setError(isError);
      setIsExecuting(false);
    });

    return () => {
      socketRef.current.off(ACTIONS.INPUT_CHANGE);
      socketRef.current.off(ACTIONS.OUTPUT_CHANGE);
    };

  }, [socketRef.current]);
}