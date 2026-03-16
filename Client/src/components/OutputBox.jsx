import { Box, Text, Spinner, VStack } from "@chakra-ui/react";

export default function OutputBox({ output, error, isExecuting }) {
    return (
        <Box
            width="100%"
            height="100%"
            display="flex"
            flexDirection="column"
        >
            <Text mb="2" color="gray.500">Output:</Text>
            <Box
                flex="1"
                border="1px"
                p='2'
                borderRadius="10"
                overflowY="auto"
                display="flex"
                alignItems={isExecuting || !output ? "center" : "flex-start"}
                justifyContent={isExecuting || !output ? "center" : "flex-start"}
                color={error ? 'red.400' : 'gray.500'}
                sx={{
                    '&::-webkit-scrollbar': {
                        width: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'gray.700',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'gray.900',
                        borderRadius: '12px'
                    },
                }}
            >
                {isExecuting ? (
                    <VStack spacing={3}>
                        <Spinner size="md" color="blue.400" />
                        <Text fontSize="sm" color="gray.500">Executing code...</Text>
                    </VStack>
                ) : output && Array.isArray(output) ? (
                    <Box width="100%" alignSelf="flex-start">
                        {output.map((line, i) => (
                            <Text key={i}>{line}</Text>
                        ))}
                    </Box>
                ) : (
                    <Text fontSize="sm">Click "Run" to run the code</Text>
                )}
            </Box>
        </Box>
    );
}