import Image from "next/image";
import { SCREENSHOT_QUALITY, type ProjectImage } from "@/data/projects";

type Props = {
  images: ProjectImage[];
  /** next/image `sizes` for one phone */
  sizes: string;
  priority?: boolean;
  /** Layout of the panel (height, padding); the phones sit top-aligned inside it */
  className?: string;
  /** Classes for each phone image (width) */
  phoneClassName?: string;
};

/**
 * Phone screenshots side by side on a tinted panel. The third one is hidden on small screens,
 * where only two fit. No device bezels: just the screenshot with rounded corners and a border.
 */
export function PhoneScreens({ images, sizes, priority, className = "", phoneClassName = "" }: Props) {
  return (
    <div className={`flex items-start justify-center gap-3 overflow-hidden bg-primary/5 sm:gap-5 ${className}`}>
      {images.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          width={img.width}
          height={img.height}
          sizes={sizes}
          quality={SCREENSHOT_QUALITY}
          priority={priority}
          className={`h-auto rounded-2xl border border-foreground/10 shadow-sm ${i >= 2 ? "hidden sm:block" : ""} ${phoneClassName}`}
        />
      ))}
    </div>
  );
}
