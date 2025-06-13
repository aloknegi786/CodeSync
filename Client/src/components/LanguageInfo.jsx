import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { LANGUAGE_INFO } from '../languageInfo';

export default function LanguageInfo({ language }) {
  const info = LANGUAGE_INFO[language];

  return (
    <Popover isLazy>
      <PopoverTrigger>
        <InfoIcon color="white" cursor="pointer" ml="5" />
      </PopoverTrigger>
      <PopoverContent color="white" bg="black">
        <PopoverArrow color="white" bg="black" />
        <PopoverCloseButton />
        <PopoverHeader>
          <InfoIcon mr="3" mb="1" color="white" />
          {info?.version || 'Unknown'}
        </PopoverHeader>
        <PopoverBody>
          {info?.description || 'No info available.'}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
