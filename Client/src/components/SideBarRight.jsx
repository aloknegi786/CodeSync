import { Box } from "@chakra-ui/react";
import OutputInput from "./OutputInput";

function SideBarRight(props) {
  return (
    <div className="h-full w-full">
      <Box
        width="100%"
        height="100%"
        overflow="hidden"
        bg="gray.800"
        color="white"
        p={4}
      >
        <OutputInput {...props} />
      </Box>
    </div>
  );
}

export default SideBarRight;