import SpriteUrl from "./teeth-layout.png";
import { TeethChart } from "./teeth-chart";

export default function TeethLayout({ spriteUrl, scale }: {
  spriteUrl?: string;
  scale?: number;
}) {
  spriteUrl = spriteUrl || SpriteUrl;
  scale = scale || 0.35;

  return (
    <TeethChart
      spriteUrl={spriteUrl}
      scale={scale}
    />
  );
}
