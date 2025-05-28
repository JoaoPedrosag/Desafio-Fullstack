import {
  HStack,
  Image,
  Box,
  Text,
  CloseButton,
  VStack,
  SimpleGrid,
  Icon,
  Center,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getFileIcon, getColorByFileType } from "../../utils/file-icons";

type SelectedFilePreviewProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export function SelectedFilePreview({
  files,
  onRemove,
}: SelectedFilePreviewProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  if (!files.length) return null;

  return (
    <Box
      w="full"
      p={3}
      borderWidth="1px"
      borderRadius="md"
      bg="gray.50"
      _dark={{ bg: "gray.700" }}
      mb={3}
    >
      <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3}>
        {files.map((file, index) =>
          file.type.startsWith("image/") ? (
            <Box
              key={index}
              position="relative"
              width="full"
              height={{ base: "120px", md: "150px" }}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              overflow="hidden"
              bg="white"
              _dark={{
                borderColor: "gray.600",
                bg: "gray.800",
              }}
            >
              <Image
                src={previews[index]}
                alt={file.name}
                objectFit="contain"
                width="100%"
                height="100%"
              />
              <Box
                position="absolute"
                bottom="0"
                left="0"
                right="0"
                p={1}
                bg="blackAlpha.700"
              >
                <Text fontSize="xs" color="white" lineClamp="1">
                  {file.name}
                </Text>
              </Box>
              <CloseButton
                size="sm"
                position="absolute"
                top="1"
                right="1"
                color="white"
                bg="blackAlpha.600"
                _hover={{ bg: "blackAlpha.800" }}
                borderRadius="full"
                onClick={() => onRemove(index)}
              />
            </Box>
          ) : (
            <Box
              key={index}
              borderWidth="1px"
              borderColor="gray.200"
              _dark={{ borderColor: "gray.600", bg: "gray.800" }}
              borderRadius="md"
              position="relative"
              bg="white"
              height={{ base: "120px", md: "150px" }}
              overflow="hidden"
            >
              <Center height="calc(100% - 24px)" p={3}>
                <Icon
                  as={getFileIcon(file.type)}
                  boxSize={10}
                  color={getColorByFileType(file.type)}
                />
              </Center>
              <Box
                position="absolute"
                bottom="0"
                left="0"
                right="0"
                p={1}
                bg="blackAlpha.700"
              >
                <Text
                  fontSize="xs"
                  color="white"
                  lineClamp="1"
                  textAlign="center"
                >
                  {file.name}
                </Text>
              </Box>
              <CloseButton
                size="sm"
                position="absolute"
                top="1"
                right="1"
                color="white"
                bg="blackAlpha.600"
                _hover={{ bg: "blackAlpha.800" }}
                borderRadius="full"
                onClick={() => onRemove(index)}
              />
            </Box>
          )
        )}
      </SimpleGrid>
    </Box>
  );
}
