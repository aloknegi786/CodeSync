import { Button,Box,Flex, useToast} from "@chakra-ui/react";

export default function Run({language,editorRef,setOutput,input,setError, role, socketRef, roomId, isLoading, setIsLoading}){
  const toast=useToast();
  async function onRun(){
    if(role !== "host"){
      return ;
    }
    const sourceCode=editorRef.current.getValue();
    if(!sourceCode) return;
    try{
      setIsLoading(true)
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
          <Button colorScheme="green" mt='2' onClick={onRun} isLoading={isLoading}>Run</Button>
          </Flex>
        </Flex>
        </Box>
        </>
    )
}