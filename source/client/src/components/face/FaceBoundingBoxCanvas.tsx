import React, { useRef, useEffect, useState } from 'react';
import { FaceMatchItem } from '../../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface FaceBoundingBoxCanvasProps {
  imageUrl: string;
  faces: FaceMatchItem[];
  selectedFaceIndex?: number | null;
  onSelectFace?: (face: FaceMatchItem, index: number) => void;
}

export const FaceBoundingBoxCanvas: React.FC<FaceBoundingBoxCanvasProps> = ({
  imageUrl,
  faces,
  selectedFaceIndex,
  onSelectFace,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes for each face
      faces.forEach((faceItem, index) => {
        const { box, is_recognized, student_name, roll_no, match_percentage } = faceItem;
        const isHovered = hoveredIndex === index;
        const isSelected = selectedFaceIndex === index;

        const isGreen = is_recognized;
        const strokeColor = isGreen ? '#10B981' : '#F97316'; // Emerald green vs Orange/Red
        const bgColor = isGreen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)';
        const tagBg = isGreen ? '#059669' : '#EA580C';

        // Box border & fill
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isHovered || isSelected ? 4 : 2.5;
        ctx.fillStyle = bgColor;

        // Draw rectangle
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.stroke();
        ctx.fill();

        // Corner accents
        const cornerLen = Math.min(box.width, box.height) * 0.25;
        ctx.lineWidth = isHovered || isSelected ? 5 : 3.5;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(box.x, box.y + cornerLen);
        ctx.lineTo(box.x, box.y);
        ctx.lineTo(box.x + cornerLen, box.y);
        // Top-right
        ctx.moveTo(box.x + box.width - cornerLen, box.y);
        ctx.lineTo(box.x + box.width, box.y);
        ctx.lineTo(box.x + box.width, box.y + cornerLen);
        // Bottom-left
        ctx.moveTo(box.x, box.y + box.height - cornerLen);
        ctx.lineTo(box.x, box.y + box.height);
        ctx.lineTo(box.x + cornerLen, box.y + box.height);
        // Bottom-right
        ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
        ctx.lineTo(box.x + box.width, box.y + box.height);
        ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
        ctx.stroke();

        // Label pill above box
        const labelText = isGreen
          ? `${roll_no} • ${student_name.split(' ')[0]} (${match_percentage}%)`
          : 'Unknown';

        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const tagWidth = textMetrics.width + 16;
        const tagHeight = 22;
        const tagX = box.x;
        const tagY = Math.max(0, box.y - tagHeight - 4);

        // Draw pill background
        ctx.fillStyle = tagBg;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 5);
        } else {
          ctx.rect(tagX, tagY, tagWidth, tagHeight);
        }
        ctx.fill();

        // Draw label text
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, tagX + 8, tagY + tagHeight / 2);
      });
    };
  }, [imageUrl, faces, hoveredIndex, selectedFaceIndex]);

  // Handle canvas mouse hover to identify which box is hovered
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let foundIdx: number | null = null;
    faces.forEach((item, idx) => {
      const { box } = item;
      if (
        mouseX >= box.x &&
        mouseX <= box.x + box.width &&
        mouseY >= box.y &&
        mouseY <= box.y + box.height
      ) {
        foundIdx = idx;
      }
    });

    setHoveredIndex(foundIdx);
  };

  const handleClick = () => {
    if (hoveredIndex !== null && onSelectFace) {
      onSelectFace(faces[hoveredIndex], hoveredIndex);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
      {/* Controls toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 border border-slate-700 shadow-md">
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-300 font-semibold px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(1.0)}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Reset Fit"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 rounded-xl bg-slate-900/90 backdrop-blur-md px-3 py-1.5 border border-slate-700 shadow-md text-xs font-semibold">
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-300">Recognized Student</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="text-orange-300">Unknown Face</span>
        </div>
      </div>

      {/* Canvas viewport container */}
      <div
        ref={containerRef}
        className="w-full max-h-[580px] overflow-auto flex items-center justify-center p-2 cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            maxWidth: zoom <= 1.0 ? '100%' : 'none',
            height: 'auto',
          }}
          className="rounded-lg shadow-inner block"
        />
      </div>

      {/* Image resolution metadata */}
      {imageSize.width > 0 && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>
            Classroom Shot: {imageSize.width} × {imageSize.height} px
          </span>
          <span>
            Detected Faces: <strong className="text-white">{faces.length}</strong> (
            <strong className="text-emerald-400">{faces.filter((f) => f.is_recognized).length}</strong> enrolled,{' '}
            <strong className="text-orange-400">{faces.filter((f) => !f.is_recognized).length}</strong> unknown)
          </span>
        </div>
      )}
    </div>
  );
};
