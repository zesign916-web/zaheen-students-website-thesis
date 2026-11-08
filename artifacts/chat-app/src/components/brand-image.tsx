import { useState } from "react";
import { brandAsset } from "@/lib/brand-assets";

export function BrandImage({
  filename,
  alt,
  className,
  fallback = "Zaheen Student",
  width,
  height,
}: {
  filename: string;
  alt: string;
  className?: string;
  fallback?: string;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span role="img" aria-label={alt} className={`brand-image-fallback ${className ?? ""}`}>{fallback}</span>;
  }

  return <img src={brandAsset(filename)} alt={alt} className={className} width={width} height={height} onError={() => setFailed(true)} />;
}
