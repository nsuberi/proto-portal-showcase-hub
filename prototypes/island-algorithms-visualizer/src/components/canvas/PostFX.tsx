import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

interface Props {
  enabled: boolean;
}

export function PostFX({ enabled }: Props) {
  if (!enabled) return null;
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.2} intensity={0.6} mipmapBlur />
      <Vignette offset={0.25} darkness={0.7} />
    </EffectComposer>
  );
}
