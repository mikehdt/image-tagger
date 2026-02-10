import { useMemo } from 'react';

import { ImageDimensions, KohyaBucket } from '@/app/store/assets';

type CropVisualizationProps = {
  dimensions: ImageDimensions;
  bucket: KohyaBucket;
  isVisible: boolean;
};

type CropAreas = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export const CropVisualization = ({
  dimensions,
  bucket,
  isVisible,
}: CropVisualizationProps) => {
  // Calculate crop areas as percentages of the image
  const cropAreas = useMemo((): CropAreas => {
    // Calculate scale factor to fill the bucket (same logic as our bucket calculation)
    const scaleToFillWidth = bucket.width / dimensions.width;
    const scaleToFillHeight = bucket.height / dimensions.height;
    const scale = Math.max(scaleToFillWidth, scaleToFillHeight);

    // Calculate scaled dimensions
    const scaledWidth = dimensions.width * scale;
    const scaledHeight = dimensions.height * scale;

    // Calculate how much gets cropped off each side
    const excessWidth = Math.max(0, scaledWidth - bucket.width);
    const excessHeight = Math.max(0, scaledHeight - bucket.height);

    // Convert to percentages of the original image
    // Crop is centered, so each side gets half the excess
    const cropLeft = excessWidth > 0 ? excessWidth / 2 / scaledWidth : 0;
    const cropRight = cropLeft;
    const cropTop = excessHeight > 0 ? excessHeight / 2 / scaledHeight : 0;
    const cropBottom = cropTop;

    return {
      top: cropTop * 100, // Convert to percentage
      bottom: cropBottom * 100,
      left: cropLeft * 100,
      right: cropRight * 100,
    };
  }, [dimensions, bucket]);

  if (!isVisible) return null;

  // If no cropping is needed, don't show anything
  if (
    cropAreas.top === 0 &&
    cropAreas.bottom === 0 &&
    cropAreas.left === 0 &&
    cropAreas.right === 0
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Top crop bar */}
      {cropAreas.top > 0 && (
        <div
          className="absolute top-0 right-0 left-0 bg-black/50"
          style={{ height: `${cropAreas.top}%` }}
        />
      )}

      {/* Bottom crop bar */}
      {cropAreas.bottom > 0 && (
        <div
          className="absolute right-0 bottom-0 left-0 bg-black/50"
          style={{ height: `${cropAreas.bottom}%` }}
        />
      )}

      {/* Left crop bar */}
      {cropAreas.left > 0 && (
        <div
          className="absolute top-0 bottom-0 left-0 bg-black/50"
          style={{ width: `${cropAreas.left}%` }}
        />
      )}

      {/* Right crop bar */}
      {cropAreas.right > 0 && (
        <div
          className="absolute top-0 right-0 bottom-0 bg-black/50"
          style={{ width: `${cropAreas.right}%` }}
        />
      )}

      {/* Optional: Add a subtle border around the "kept" area */}
      <div
        className="absolute border-2 border-dotted border-white/80"
        style={{
          top: `${cropAreas.top}%`,
          bottom: `${cropAreas.bottom}%`,
          left: `${cropAreas.left}%`,
          right: `${cropAreas.right}%`,
        }}
      />
    </div>
  );
};
