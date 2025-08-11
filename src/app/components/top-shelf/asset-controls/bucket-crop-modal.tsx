'use client';

import { useCallback, useMemo, useState } from 'react';

import { Modal } from '@/app/components/shared/modal';
import { calculateKohyaBucket, KOHYA_CONFIGS } from '@/app/utils/image-utils';

type BucketCropModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const BucketCropModal = ({ isOpen, onClose }: BucketCropModalProps) => {
  const [inputWidth, setInputWidth] = useState('1024');
  const [inputHeight, setInputHeight] = useState('768');

  // Parse dimensions from inputs, with fallback to defaults
  const dimensions = useMemo(() => {
    const width = parseInt(inputWidth) || 1024;
    const height = parseInt(inputHeight) || 768;
    return { width, height };
  }, [inputWidth, inputHeight]);

  // Calculate bucket for current dimensions
  const bucket = useMemo(() => {
    return calculateKohyaBucket(
      dimensions.width,
      dimensions.height,
      KOHYA_CONFIGS.SDXL_1024,
    );
  }, [dimensions]);

  // Calculate visualization box dimensions (scale to fit within 400x300)
  const visualizationDimensions = useMemo(() => {
    const maxWidth = 400;
    const maxHeight = 300;

    const scaleX = maxWidth / dimensions.width;
    const scaleY = maxHeight / dimensions.height;
    const scale = Math.min(scaleX, scaleY);

    return {
      width: Math.round(dimensions.width * scale),
      height: Math.round(dimensions.height * scale),
    };
  }, [dimensions]);

  // Calculate crop overlay dimensions for visualization
  const cropVisualization = useMemo(() => {
    // Calculate scale factor to fill the bucket
    const scaleToFillWidth = bucket.width / dimensions.width;
    const scaleToFillHeight = bucket.height / dimensions.height;
    const scale = Math.max(scaleToFillWidth, scaleToFillHeight);

    // Calculate scaled dimensions
    const scaledWidth = dimensions.width * scale;
    const scaledHeight = dimensions.height * scale;

    // Calculate how much gets cropped off each side
    const excessWidth = Math.max(0, scaledWidth - bucket.width);
    const excessHeight = Math.max(0, scaledHeight - bucket.height);

    // Convert to percentages of the visualization box
    const cropLeft =
      excessWidth > 0 ? (excessWidth / 2 / scaledWidth) * 100 : 0;
    const cropRight = cropLeft;
    const cropTop =
      excessHeight > 0 ? (excessHeight / 2 / scaledHeight) * 100 : 0;
    const cropBottom = cropTop;

    return {
      top: cropTop,
      bottom: cropBottom,
      left: cropLeft,
      right: cropRight,
    };
  }, [dimensions, bucket]);

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputWidth(e.target.value);
    },
    [],
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputHeight(e.target.value);
    },
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Bucket Crop Visualization
        </h2>

        {/* Calculated bucket info */}
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="mb-2 font-medium text-slate-700">Calculated Bucket</h3>
          <div className="text-sm text-slate-600">
            <p>
              <span className="font-medium">Dimensions:</span> {bucket.width} ×{' '}
              {bucket.height}
            </p>
            <p>
              <span className="font-medium">Aspect Ratio:</span>{' '}
              {bucket.aspectRatio.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Visualization box */}
        <div className="flex justify-center">
          <div className="relative flex h-80 items-center justify-center">
            <div className="relative">
              <div
                className="border-2 border-slate-300 bg-slate-200"
                style={{
                  width: `${visualizationDimensions.width}px`,
                  height: `${visualizationDimensions.height}px`,
                }}
              >
                {/* Crop overlays */}
                {cropVisualization.top > 0 && (
                  <div
                    className="absolute top-0 right-0 left-0 bg-black/50"
                    style={{ height: `${cropVisualization.top}%` }}
                  />
                )}
                {cropVisualization.bottom > 0 && (
                  <div
                    className="absolute right-0 bottom-0 left-0 bg-black/50"
                    style={{ height: `${cropVisualization.bottom}%` }}
                  />
                )}
                {cropVisualization.left > 0 && (
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-black/50"
                    style={{ width: `${cropVisualization.left}%` }}
                  />
                )}
                {cropVisualization.right > 0 && (
                  <div
                    className="absolute top-0 right-0 bottom-0 bg-black/50"
                    style={{ width: `${cropVisualization.right}%` }}
                  />
                )}

                {/* Kept area border */}
                <div
                  className="absolute border-2 border-dotted border-white/80"
                  style={{
                    top: `${cropVisualization.top}%`,
                    bottom: `${cropVisualization.bottom}%`,
                    left: `${cropVisualization.left}%`,
                    right: `${cropVisualization.right}%`,
                  }}
                />
              </div>

              {/* Dimension labels */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-center text-xs whitespace-nowrap text-slate-500">
                {dimensions.width} × {dimensions.height}
              </div>
            </div>
          </div>
        </div>

        {/* Input controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="width-input"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Width
            </label>
            <input
              id="width-input"
              type="number"
              value={inputWidth}
              onChange={handleWidthChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              min="1"
              max="4096"
            />
          </div>
          <div>
            <label
              htmlFor="height-input"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Height
            </label>
            <input
              id="height-input"
              type="number"
              value={inputHeight}
              onChange={handleHeightChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              min="1"
              max="4096"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
