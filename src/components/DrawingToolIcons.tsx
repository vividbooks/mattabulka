import type { SVGProps } from 'react';

type IllustrationProps = SVGProps<SVGSVGElement> & {
  /** Vnější strana (čtverec); viewBox zůstává uvnitř. */
  size?: number;
};

function baseProps(size: number, rest: SVGProps<SVGSVGElement>) {
  const { className, style, ...other } = rest;
  return {
    width: size,
    height: size,
    className: ['drawing-tool-illustration', className].filter(Boolean).join(' '),
    style: { overflow: 'visible', ...style },
    ...other,
  };
}

/** Tužka / štětec — výřez z dodaného SVG. */
export function DrawingToolBrushIllustration({ size = 44, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="4 8 104 62" fill="none" xmlns="http://www.w3.org/2000/svg" {...baseProps(size, rest)}>
      <path
        d="M45.665 11.3563L7.00082 19.4389L16.7204 65.9339L55.3846 57.8513L92.8127 31.638L90.6642 21.3602L45.665 11.3563Z"
        fill="#D2DFFF"
        stroke="#93B2FF"
        strokeWidth={3}
      />
      <path
        d="M90.6642 21.3602L45.665 11.3563L55.3846 57.8513L92.8127 31.638L90.6642 21.3602Z"
        fill="#AAB6D5"
      />
      <path
        d="M45.665 11.3563L7.00082 19.4389L16.7204 65.9339L55.3846 57.8513L92.8127 31.638L90.6642 21.3602L45.665 11.3563Z"
        stroke="#93B2FF"
        strokeWidth={3}
      />
      <path
        d="M98.7796 18.6423C101.483 18.0772 104.132 19.8104 104.697 22.5133L105.106 24.471C105.671 27.174 103.938 29.8233 101.235 30.3883L91.4467 32.4346L88.9912 20.6885L98.7796 18.6423Z"
        fill="#D2DFFF"
      />
      <path d="M50.4814 17.0044L86.0914 25" stroke="#B7C3E1" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** Zvýrazňovač — výřez z dodaného SVG. */
export function DrawingToolHighlighterIllustration({ size = 44, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 98 94 78" fill="none" xmlns="http://www.w3.org/2000/svg" {...baseProps(size, rest)}>
      <path
        d="M35.9719 103.34L5.70257 107.083L13.123 167.079L43.3924 163.336L62.1302 143.752L74.0394 142.279C76.78 141.94 78.7269 139.443 78.3879 136.703L76.4148 120.75C76.0759 118.009 73.5794 116.062 70.8389 116.401L58.9296 117.874L35.9719 103.34Z"
        fill="#FFEE80"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path d="M37.001 105L40.001 134" stroke="white" strokeWidth={3} strokeLinecap="round" />
      <path
        d="M83.364 115.404L73.7024 116.599C71.606 116.858 70.0726 118.703 70.2008 120.812L71.2347 137.813C71.3748 140.116 73.4287 141.823 75.7184 141.54L82.9348 140.648C84.8166 140.415 86.2765 138.893 86.4306 137.003L87.8418 119.699C88.0479 117.172 85.8805 115.093 83.364 115.404Z"
        fill="#FFDD00"
      />
    </svg>
  );
}

/** Guma — výřez z dodaného SVG. */
export function DrawingToolEraserIllustration({ size = 44, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="-6 194 84 70" fill="none" xmlns="http://www.w3.org/2000/svg" {...baseProps(size, rest)}>
      <rect
        x="11.5573"
        y="205.817"
        width="57"
        height="45"
        rx="6.5"
        transform="rotate(-12.1888 11.5573 205.817)"
        fill="#AB7278"
        stroke="#A46D73"
        strokeWidth={3}
      />
      <rect
        x="1.78289"
        y="207.929"
        width="57"
        height="45"
        rx="6.5"
        transform="rotate(-12.1888 1.78289 207.929)"
        fill="#E0949D"
        stroke="#A46D73"
        strokeWidth={3}
      />
    </svg>
  );
}

/** Lísteček — dodané SVG (post-it). */
export function DrawingToolStickyNoteIllustration({ size = 44, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="0 0 77 77" fill="none" xmlns="http://www.w3.org/2000/svg" {...baseProps(size, rest)}>
      <path
        d="M1.03747 21.4768C0.46449 19.6465 1.48375 17.6983 3.31405 17.1253L54.6819 1.04458C56.5122 0.471599 58.4604 1.49086 59.0334 3.32116L70.9643 41.4328C73.8292 50.5843 68.7329 60.3255 59.5813 63.1904L21.4697 75.1213C19.6394 75.6942 17.6912 74.675 17.1182 72.8447L1.03747 21.4768Z"
        fill="#F9F3D8"
      />
      <path
        d="M54.29 44.8332L59.9961 63.0605C71.181 59.559 73.7133 48.7595 70.4461 39.7755L54.29 44.8332Z"
        fill="#B1A56F"
      />
    </svg>
  );
}

/** Tvary (kolečko + čtvereček) — výřez z dodaného SVG. */
export function DrawingToolShapesIllustration({ size = 44, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="8 368 74 58" fill="none" xmlns="http://www.w3.org/2000/svg" {...baseProps(size, rest)}>
      <circle cx="40" cy="396" r="20" fill="#F03B50" />
      <rect
        x="47.6911"
        y="399.82"
        width="34"
        height="34"
        rx="2.5"
        transform="rotate(9.94384 47.6911 399.82)"
        stroke="#95C4FF"
        strokeWidth={3}
      />
    </svg>
  );
}

/** Text na plátno — výřez z dodaného SVG. */
export function DrawingToolTextIllustration({ size = 44, ...rest }: IllustrationProps) {
  return (
    <svg viewBox="8 254 98 92" fill="none" xmlns="http://www.w3.org/2000/svg" {...baseProps(size, rest)}>
      <rect
        x="19.2466"
        y="271.404"
        width="68.5847"
        height="71.1112"
        rx="7.5"
        transform="rotate(6.92677 19.2466 271.404)"
        fill="#7A86A5"
        stroke="#7A86A5"
        strokeWidth={3}
      />
      <rect
        x="20.1851"
        y="270.67"
        width="66.9003"
        height="66.9003"
        rx="7.5"
        transform="rotate(6.92677 20.1851 270.67)"
        fill="white"
        stroke="#7A86A5"
        strokeWidth={3}
      />
      <path
        d="M38.5986 323.146L55.3192 325.178"
        stroke="#7A86A5"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M47.0531 323.382L50.9195 291.557L37.1768 289.887L36.4846 295.584"
        stroke="#7A86A5"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M47.053 323.382L50.9193 291.557L64.6621 293.227L63.97 298.924"
        stroke="#7A86A5"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
