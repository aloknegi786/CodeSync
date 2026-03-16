import { Button,Box,Flex, useToast, shouldForwardProp} from "@chakra-ui/react";

export default function Run({
  language,
  editorRef,
  setOutput,
  input,
  setError, 
  role, 
  socketRef, 
  roomId, 
  isExecuting,
  setIsExecuting
}){
  const toast=useToast();
  async function onRun(){
    if(role !== "host"){
      return ;
    }
    const sourceCode=editorRef.current.getValue();
    if(!sourceCode) return;
    try{
      setIsExecuting(true);
      socketRef.current.emit("execute", {
          roomId
      });
    }catch(err){
      toast({
        title:"An Error Occured",
        description:err.message || "unable to run the code",
        status:'error',
        duration:6000
      })
    }finally{
     
    }
  }
    return (
        <>
        <Box >
          <Flex justifyContent="space-between" alignItems="center">
            <Flex ml="auto"  justifyContent='center' alignItems="center">
              <Button colorScheme="green" mt='2' onClick={onRun} isLoading={isExecuting}>Run</Button>
              </Flex>
          </Flex>
        </Box>
        </>
    )
}