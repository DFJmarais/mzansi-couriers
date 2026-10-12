import { useState } from "react";

const LOGO_SRC = "/manus-storage/mzansi-couriers-logo-no-toyota-faithful_de7af096.png?v=faithful-20260831";
const LOCAL_LOGO_SRC = "/mzansi-couriers-logo.jpg";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "h-10 w-10" }: BrandLogoProps) {
  const [source, setSource] = useState(LOGO_SRC);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        aria-label="Mzansi Couriers"
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-sm font-black tracking-tight text-amber-300 ${className}`}
      >
        MC
      </span>
    );
  }

  return (
    <img
      src={source}
      alt="Mzansi Couriers"
      className={`shrink-0 object-contain ${className}`}
      onError={() => {
        if (source !== LOCAL_LOGO_SRC) {
          setSource(LOCAL_LOGO_SRC);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

export default BrandLogo;

