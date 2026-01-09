import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Trash2, Loader2, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  user: User | null;
  onUpdate: (user: User) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  // Set canvas size to desired output (256x256 for avatar)
  const outputSize = 256;
  canvas.width = outputSize;
  canvas.height = outputSize;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputSize,
    outputSize
  );
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.9
    );
  });
}

const AvatarUpload = ({ user, onUpdate }: AvatarUploadProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const getAvatarUrl = () => {
    if (user?.avatar) {
      if (user.avatar.startsWith("/")) {
        return `https://invoices.ieosuia.com${user.avatar}`;
      }
      return user.avatar;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const validateAndLoadFile = (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, GIF, or WEBP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "");
      setPreviewUrl(null);
      setIsOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndLoadFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndLoadFile(files[0]);
    }
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  // Generate preview when crop changes
  useEffect(() => {
    const generatePreview = async () => {
      if (imgRef.current && completedCrop?.width && completedCrop?.height) {
        try {
          const blob = await getCroppedImg(imgRef.current, completedCrop);
          const url = URL.createObjectURL(blob);
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        } catch (error) {
          console.error("Error generating preview:", error);
        }
      }
    };
    generatePreview();
  }, [completedCrop]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleUpload = async () => {
    if (!imgRef.current || !completedCrop) return;
    
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      
      const { user: updatedUser } = await authService.uploadAvatar(file);
      onUpdate(updatedUser);
      
      toast({ title: "Avatar updated successfully" });
      setIsOpen(false);
      setImgSrc("");
      setPreviewUrl(null);
    } catch (error) {
      toast({
        title: "Failed to upload avatar",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const updatedUser = await authService.deleteAvatar();
      onUpdate(updatedUser);
      toast({ title: "Avatar removed successfully" });
    } catch (error) {
      toast({
        title: "Failed to remove avatar",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setImgSrc("");
    setPreviewUrl(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const avatarUrl = getAvatarUrl();

  return (
    <>
      {/* Avatar with hover actions */}
      <div
        ref={dropZoneRef}
        className={cn(
          "relative group cursor-pointer transition-all duration-200",
          isDragging && "scale-110"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div
          className={cn(
            "w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold ring-4 ring-transparent transition-all",
            isDragging && "ring-accent ring-offset-2 ring-offset-background"
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(user?.name || "U")
          )}
        </div>
        
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full bg-accent/80 flex items-center justify-center">
            <Upload className="w-8 h-8 text-accent-foreground animate-bounce" />
          </div>
        )}
        
        {/* Hover overlay */}
        {!isDragging && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <Camera className="h-4 w-4" />
            </Button>
            {avatarUrl && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={onSelectFile}
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Click or drag & drop to upload
      </p>

      {/* Crop Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Your Photo</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-[1fr_200px] gap-6">
            {/* Crop Area */}
            <div className="flex justify-center items-center bg-muted/30 rounded-lg p-4 min-h-[300px]">
              {imgSrc ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  className="max-h-[400px]"
                >
                  <img
                    ref={imgRef}
                    alt="Crop"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-h-[400px]"
                  />
                </ReactCrop>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No image selected</p>
                </div>
              )}
            </div>
            
            {/* Preview Panel */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm font-medium text-muted-foreground">Preview</div>
              
              {/* Large preview */}
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-border shadow-lg">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              {/* Small preview */}
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-border">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Small preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Tiny preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                This is how your avatar will look at different sizes
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !previewUrl}
              variant="accent"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Photo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUpload;
