import { Link } from 'react-router-dom';

type Props = {
  /** Altura da imagem em pixels (Tailwind h-* equivalente via style opcional) */
  className?: string;
  imgClassName?: string;
};

/**
 * Logo da marca Ray Labs (arquivo em /public/logo-raylabs.png).
 */
export function BrandLogo({ className = '', imgClassName = 'h-9 sm:h-10 w-auto' }: Props) {
  return (
    <Link to="/products" className={`flex shrink-0 items-center gap-2 ${className}`}>
      <img
        src="/logo-raylabs.png"
        alt="Ray Labs e-commerce"
        className={`object-contain object-left ${imgClassName}`}
        width={180}
        height={48}
        decoding="async"
      />
    </Link>
  );
}
