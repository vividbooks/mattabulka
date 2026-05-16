import svgPaths from "./svg-6p49xe8ny5";

function Vrstva() {
  return (
    <div className="absolute h-[29.063px] left-0 top-0 w-[33.906px]" data-name="Vrstva_1">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 30">
        <g clipPath="url(#clip0_1_612)" id="Vrstva_1">
          <path d={svgPaths.p29c2620} fill="var(--fill-0, #DEE4F1)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_1_612">
            <rect fill="white" height="29.0625" width="33.9062" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <Vrstva />
    </div>
  );
}
