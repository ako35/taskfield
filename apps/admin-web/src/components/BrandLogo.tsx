interface BrandLogoProps {
  onClick: () => void;
}

export function BrandLogo({ onClick }: BrandLogoProps) {
  return (
    <button className="public-brand" type="button" onClick={onClick}>
      <span>TF</span>
      <strong>Taskfield</strong>
    </button>
  );
}
