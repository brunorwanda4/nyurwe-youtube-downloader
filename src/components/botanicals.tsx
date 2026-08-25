import Image from "next/image";

export function Botanicals({ className = "" }: { className?: string }) {
  return (
    <Image
      className={`botanical-edge ${className}`}
      src="/assets/moss-edge.png"
      width={1536}
      height={1024}
      alt=""
      aria-hidden="true"
      priority
    />
  );
}
