import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  Link,
  Skeleton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  LinkPreview as LinkPreviewType,
  fetchLinkPreview,
} from "../../services/link-preview";
import { FiExternalLink } from "react-icons/fi";

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(false);

        const result = await fetchLinkPreview(url);

        if (!isCancelled) {
          setPreview(result);
          setError(!result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(true);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <Box
        maxW="400px"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
        bg="gray.50"
        _dark={{ borderColor: "gray.600", bg: "gray.700" }}
      >
        <HStack p={3} gap={3} align="start">
          <Skeleton boxSize="60px" borderRadius="md" />
          <VStack align="start" flex={1} gap={2}>
            <Skeleton height="16px" width="80%" />
            <Skeleton height="12px" width="100%" />
            <Skeleton height="12px" width="60%" />
          </VStack>
        </HStack>
      </Box>
    );
  }

  if (error || !preview) {
    return (
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        color="blue.500"
        _hover={{ textDecoration: "underline" }}
        fontSize="sm"
      >
        <HStack gap={1}>
          <Text>{url}</Text>
          <FiExternalLink size={12} />
        </HStack>
      </Link>
    );
  }

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      _hover={{ textDecoration: "none" }}
    >
      <Box
        maxW="400px"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
        bg="gray.50"
        transition="all 0.2s"
        cursor="pointer"
        _dark={{ borderColor: "gray.600", bg: "gray.700" }}
        _hover={{
          bg: "gray.100",
          _dark: { bg: "gray.600" },
          transform: "scale(1.02)",
        }}
      >
        {preview.image && (
          <Image
            src={preview.image}
            alt={preview.title || "Preview"}
            maxH="200px"
            w="full"
            objectFit="cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        <VStack align="start" p={3} gap={2}>
          {preview.siteName && (
            <HStack gap={2} align="center">
              {preview.favicon && (
                <Image
                  src={preview.favicon}
                  alt="favicon"
                  boxSize="16px"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <Text fontSize="xs" color="gray.500" fontWeight="medium">
                {preview.siteName}
              </Text>
            </HStack>
          )}

          {preview.title && (
            <Text
              fontSize="sm"
              fontWeight="semibold"
              lineHeight="1.3"
              color="gray.900"
              _dark={{ color: "white" }}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {preview.title}
            </Text>
          )}

          {preview.description && (
            <Text
              fontSize="xs"
              color="gray.600"
              _dark={{ color: "gray.300" }}
              lineHeight="1.4"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {preview.description}
            </Text>
          )}

          <HStack gap={1} align="center">
            <Text fontSize="xs" color="blue.500" fontWeight="medium">
              {new URL(url).hostname}
            </Text>
            <FiExternalLink size={10} color="var(--chakra-colors-blue-500)" />
            {preview.provider && (
              <Text fontSize="2xs" color="gray.400" fontStyle="italic">
                • {preview.provider}
              </Text>
            )}
          </HStack>
        </VStack>
      </Box>
    </Link>
  );
}
