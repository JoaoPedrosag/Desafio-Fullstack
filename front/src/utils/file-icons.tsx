import {
  FiFile,
  FiFileText,
  FiVideo,
  FiMusic,
  FiCode,
  FiArchive,
  FiFilePlus,
  FiImage,
} from "react-icons/fi";
import { IconType } from "react-icons";

export const getFileIcon = (mimetype: string): IconType => {
  if (mimetype.startsWith("image/")) return FiImage;
  if (mimetype.startsWith("video/")) return FiVideo;
  if (mimetype.startsWith("audio/")) return FiMusic;
  if (mimetype.startsWith("text/")) {
    if (
      mimetype.includes("javascript") ||
      mimetype.includes("typescript") ||
      mimetype.includes("json")
    ) {
      return FiCode;
    }
    return FiFileText;
  }
  if (
    mimetype.includes("zip") ||
    mimetype.includes("rar") ||
    mimetype.includes("tar") ||
    mimetype.includes("7z")
  ) {
    return FiArchive;
  }
  if (mimetype.includes("pdf")) return FiFilePlus;
  return FiFile;
};

export const getColorByFileType = (mimetype: string): string => {
  if (mimetype.startsWith("image/")) return "pink.500";
  if (mimetype.startsWith("video/")) return "red.500";
  if (mimetype.startsWith("audio/")) return "purple.500";
  if (mimetype.startsWith("text/")) {
    if (
      mimetype.includes("javascript") ||
      mimetype.includes("typescript") ||
      mimetype.includes("json")
    ) {
      return "yellow.500";
    }
    return "blue.500";
  }
  if (
    mimetype.includes("zip") ||
    mimetype.includes("rar") ||
    mimetype.includes("tar") ||
    mimetype.includes("7z")
  ) {
    return "orange.500";
  }
  if (mimetype.includes("pdf")) return "red.500";
  return "gray.500";
};
