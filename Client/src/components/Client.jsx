import { Avatar, Box, Text } from '@chakra-ui/react';

function Client({ client, promote }) {
  const isOnline = client?.connected ?? true;

  return (
    <Box
      className="client"
      cursor="pointer"
      display="flex"
      alignItems="center"
      gap={2}
      onClick={() => promote(client.socketId, client.role, client.email)}
    >
      <Box position="relative">
        <Avatar
          name={client?.username}
          bg="orange.500"
          width="52px"
          height="48px"
          borderRadius="12px"
        />

        {/* status indicator */}
        <Box
          position="absolute"
          bottom="2px"
          right="2px"
          width="10px"
          height="10px"
          borderRadius="50%"
          bg={isOnline ? "green.400" : "gray.400"}
          border="2px solid white"
        />
      </Box>

      <Text className="userName">
        {client?.username}
      </Text>
    </Box>
  );
}

export default Client;