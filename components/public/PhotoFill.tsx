import Image from "next/image";
import type { Photo } from "@/lib/media";

/** Foto, das seinen Rahmen ausfüllt (Rahmen bestimmt das Format, z. B. aspect-[4/5]). */
export function PhotoFill({ photo, sizes, priority = false }: { photo: Photo; sizes: string; priority?: boolean }) {
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      style={{ objectPosition: photo.focus }}
    />
  );
}
