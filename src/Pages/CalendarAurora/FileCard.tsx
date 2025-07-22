import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

interface FileCardProps {
  file: any;
  index: number;
  DeleteFile: (index: number | any) => void;
  variant: "default" | "delete";
}

export default function FileCard({
  file,
  index,
  DeleteFile,
  variant,
}: FileCardProps) {
  const [fileIcon, setFileIcon] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  // Ottieni nome del file e la sua estensione separatamente
  const initialFileName =
    file.FileName || file.EventAttachmentName || file.file?.name || "Documento";
  const extension = initialFileName.includes('.') 
    ? initialFileName.substring(initialFileName.lastIndexOf("."))
    : ".pdf";
  const [newFileName, setNewFileName] = useState("");

  useEffect(() => {
    setNewFileName(initialFileName.replace(extension, ""));
    setFileIcon(getFileIcon(extension));
  }, [file, variant]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEditing) {
        setIsEditing(false);
        setNewFileName(initialFileName.replace(extension, ""));
      }
    };

    if (isEditing) {
      window.addEventListener("keydown", handleEsc);
    } else {
      window.removeEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [isEditing, initialFileName, extension]);

  // Mock function to get file icon based on extension
  function getFileIcon(ext: string): string {
    const iconMap: { [key: string]: string } = {
      '.pdf': 'solar:file-text-bold',
      '.doc': 'solar:document-text-bold',
      '.docx': 'solar:document-text-bold',
      '.xls': 'solar:file-bold',
      '.xlsx': 'solar:file-bold',
      '.ppt': 'solar:presentation-graph-bold',
      '.pptx': 'solar:presentation-graph-bold',
      '.jpg': 'solar:image-bold',
      '.jpeg': 'solar:image-bold',
      '.png': 'solar:image-bold',
      '.gif': 'solar:image-bold',
      '.zip': 'solar:archive-down-bold',
      '.rar': 'solar:archive-down-bold',
      '.txt': 'solar:text-bold',
      '.csv': 'solar:file-bold',
    };
    
    return iconMap[ext.toLowerCase()] || 'solar:file-bold';
  }

  const handleRename = async () => {
    if (!newFileName.trim()) {
      alert("Il nome del file non può essere vuoto.");
      return;
    }

    try {
      const updatedFileName = `${newFileName.trim()}${extension}`;
      setIsEditing(false);
      
      // Mock API call for CosmicHub
      console.log("Rinomina file:", {
        fileId: file.ProjectFileId || file.EventAttachmentId,
        oldName: initialFileName,
        newName: updatedFileName,
      });
      
      // Update local state
      if (file.FileName) {
        file.FileName = updatedFileName;
      } else if (file.EventAttachmentName) {
        file.EventAttachmentName = updatedFileName;
      } else if (file.file?.name) {
        file.file.name = updatedFileName;
      }
      
    } catch (error) {
      console.error("Errore durante la rinomina del file:", error);
      alert("Errore durante la rinomina del file");
    }
  };

  const downloadFile = async () => {
    try {
      // Mock download for CosmicHub
      const fileName = initialFileName.startsWith(".")
        ? ` ${initialFileName}`
        : initialFileName;

      console.log("Download file:", fileName);
      
      // Simulate download (in real implementation, this would be an actual file download)
      const link = document.createElement("a");
      link.href = "#";
      link.setAttribute("download", fileName);
      
      // Show notification
      alert(`Download simulato: ${fileName}`);
      
    } catch (error) {
      console.error("Errore durante il download del file:", error);
      alert("Errore durante il download del file");
    }
  };

  const getFileSize = (file: any): string => {
    if (file.FileSize) return formatFileSize(file.FileSize);
    if (file.file?.size) return formatFileSize(file.file.size);
    return "N/A";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      {variant === "default" && (
        <div className="border border-default-200 bg-default-50 p-4 flex flex-row items-center rounded-lg justify-between hover:bg-default-100 transition-colors">
          <div className="flex-1 flex flex-row gap-3 items-center min-w-0">
            <div className="flex items-center justify-center border border-default-300 rounded-lg h-12 w-12 bg-background flex-shrink-0">
              <Icon 
                icon={fileIcon} 
                width={24} 
                className="text-default-600"
              />
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFileName.trim()) {
                      handleRename();
                    }
                  }}
                  className="text-sm flex-1 border-b border-primary focus:outline-none p-1 bg-transparent font-medium"
                  autoFocus
                />
                <span className="text-sm text-default-500 font-medium">{extension}</span>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {newFileName + extension}
                </h4>
                <p className="text-xs text-default-500">
                  {getFileSize(file)}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-row gap-2 items-center ml-3">
            {isEditing && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="flat"
                  color="success"
                  isIconOnly
                  onPress={handleRename}
                  isDisabled={!newFileName.trim()}
                >
                  <Icon icon="solar:check-bold" width={16} />
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  isIconOnly
                  onPress={() => {
                    setIsEditing(false);
                    setNewFileName(initialFileName.replace(extension, ""));
                  }}
                >
                  <Icon icon="solar:close-circle-bold" width={16} />
                </Button>
              </div>
            )}
            
            {!isEditing && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="light"
                    size="sm"
                    isIconOnly
                  >
                    <Icon icon="solar:menu-dots-bold" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="download"
                    startContent={
                      <Icon icon="solar:download-bold" width={16} />
                    }
                    onPress={downloadFile}
                  >
                    Scarica file
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    startContent={
                      <Icon icon="solar:pen-2-bold" width={16} />
                    }
                    onPress={() => setIsEditing(true)}
                  >
                    Rinomina file
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={
                      <Icon icon="solar:trash-bin-trash-bold" width={16} />
                    }
                    onPress={() => DeleteFile(file)}
                  >
                    Rimuovi file
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </div>
      )}

      {variant === "delete" && DeleteFile && (
        <div className="border border-danger-200 bg-danger-50 p-4 flex flex-row items-center rounded-lg justify-between">
          <div className="flex-1 flex flex-row gap-3 items-center min-w-0">
            <div className="flex items-center justify-center border border-danger-300 rounded-lg h-12 w-12 bg-background flex-shrink-0">
              <Icon 
                icon={fileIcon} 
                width={24} 
                className="text-danger-600"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-danger-700 truncate">
                {file.EventAttachmentName || file.file?.name || initialFileName}
              </h4>
              <p className="text-xs text-danger-500">
                {getFileSize(file)} • In attesa di rimozione
              </p>
            </div>
          </div>
          <div className="flex flex-row gap-2 items-center ml-3">
            <Button
              size="sm"
              color="danger"
              variant="flat"
              isIconOnly
              onPress={() => DeleteFile(index)}
            >
              <Icon icon="solar:trash-bin-trash-bold" width={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
} 