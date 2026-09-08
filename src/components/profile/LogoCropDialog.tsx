import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props { file: File | null; onCancel: () => void; onCrop: (file: File) => void }

export function LogoCropDialog({ file, onCancel, onCrop }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom,setZoom]=useState(1), [x,setX]=useState(50), [y,setY]=useState(50);
  const [imageReady,setImageReady]=useState(false), [imageError,setImageError]=useState(false);
  const url = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { setZoom(1); setX(50); setY(50); setImageReady(false); setImageError(false); }, [file]);
  const confirm=()=>{
    const image=imageRef.current; if(!image||!file||!imageReady||!image.naturalWidth||!image.naturalHeight)return;
    const width=900,height=360,canvas=document.createElement('canvas'); canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');if(!context)return;
    const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight)*zoom;
    const drawWidth=image.naturalWidth*scale,drawHeight=image.naturalHeight*scale;
    context.clearRect(0,0,width,height);
    const overflowX=Math.max(0,drawWidth-width),overflowY=Math.max(0,drawHeight-height);
    const spareX=Math.max(0,width-drawWidth),spareY=Math.max(0,height-drawHeight);
    context.drawImage(image,spareX*x/100-overflowX*x/100,spareY*y/100-overflowY*y/100,drawWidth,drawHeight);
    canvas.toBlob(blob=>blob&&onCrop(new File([blob],'cropped-logo.png',{type:'image/png'})),'image/png',0.92);
  };
  return <Dialog open={!!file} onOpenChange={open=>!open&&onCancel()}><DialogContent className="max-w-2xl">
    <DialogHeader><DialogTitle>Position business logo</DialogTitle><DialogDescription>The full logo is fitted by default. Zoom only if you intentionally want to crop it.</DialogDescription></DialogHeader>
    <div className="aspect-[5/2] overflow-hidden rounded-lg border bg-white">{url&&<img ref={imageRef} src={url} alt="Logo preview" onLoad={()=>setImageReady(true)} onError={()=>setImageError(true)} className="h-full w-full object-contain" style={{objectPosition:`${x}% ${y}%`,transform:`scale(${zoom})`}}/>}</div>
    {imageError && <p className="text-sm text-destructive">This picture could not be read. Please choose a PNG or JPG image.</p>}
    <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Zoom<Input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label className="text-sm">Horizontal<Input type="range" min="0" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/></label><label className="text-sm">Vertical<Input type="range" min="0" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/></label></div>
    <DialogFooter><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={confirm} disabled={!imageReady || imageError}>Use this logo</Button></DialogFooter>
  </DialogContent></Dialog>;
}
