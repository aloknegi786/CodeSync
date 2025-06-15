import React from 'react';
import { Avatar, Box, Text } from '@chakra-ui/react';
import { ACTIONS } from '../../../Server/src/utils/Actions';

function Client({ client, promote }) {
  return (
    <Box
      className="client"
      cursor="pointer"
      display="flex"
      alignItems="center"
      gap={2}
      onClick={() => promote(client.socketId, client.role)}
    >
      <Avatar
        name={client?.username}
        bg="orange.500"
        width="52px"
        height="48px"
        borderRadius="12px"
      />
      <Text className="userName">{client?.username}</Text>
    </Box>
  );
}

export default Client;
