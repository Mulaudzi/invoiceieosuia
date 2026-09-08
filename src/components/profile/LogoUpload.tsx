import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Loader2, ImageIcon } from "@/lib/icons";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import axios from "axios";
import { LogoCropDialog } from "./LogoCropDialog";
import { mediaUrl } from "@/lib/mediaUrl";
import { usePrivateMediaUrl } from "@/hooks/usePrivateMediaUrl";

export function LogoUpload() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const uploadLogo = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG or JPG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      
      await api.post("/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      await refreshUser?.();
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      toast({
        title: "Failed to upload logo",
        description: axios.isAxiosError(error) ? error.response?.data?.message || error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0];
    if (file) setCropFile(file);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete("/logo");
      await refreshUser?.();
      toast({ title: "Logo removed successfully" });
    } catch (error) {
      toast({
        title: "Failed to remove logo",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const logoPath = mediaUrl((user as any)?.logo_path || (user as any)?.logoPath);
  const logoUrl = usePrivateMediaUrl(logoPath);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Business Logo</CardTitle>
        <CardDescription>
          Upload your business logo to appear on invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Business logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {logoUrl ? "Change Logo" : "Upload Logo"}
            </Button>

            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Remove Logo
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              PNG or JPG. Max 2MB.
            </p>
          </div>
        </div>
      </CardContent>
      <LogoCropDialog file={cropFile} onCancel={()=>setCropFile(null)} onCrop={file=>{setCropFile(null);void uploadLogo(file)}}/>
    </Card>
  );
}
