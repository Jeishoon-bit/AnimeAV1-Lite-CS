import type { PosterKey } from '../types/anime';

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

export const POSTER_ASSETS: Record<PosterKey, string> = {
  hero_kurogane: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" fill="none">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#09090f"/>
          <stop offset="55%" stop-color="#1c192b"/>
          <stop offset="100%" stop-color="#3a1e24"/>
        </linearGradient>
        <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#e11d48"/>
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#18181b"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#sky)"/>
      <circle cx="920" cy="240" r="140" fill="#e11d48" fill-opacity="0.12"/>
      <g opacity="0.55" fill="#0f1018">
        <rect x="60" y="250" width="90" height="320"/>
        <rect x="170" y="190" width="110" height="380"/>
        <rect x="310" y="290" width="80" height="280"/>
        <rect x="620" y="270" width="95" height="300"/>
        <rect x="740" y="210" width="120" height="360"/>
        <rect x="1030" y="180" width="130" height="390"/>
        <rect x="1180" y="260" width="90" height="310"/>
      </g>
      <path d="M920 120 L955 460 L885 460 Z" fill="url(#tower)" opacity="0.85"/>
      <path d="M902 250 H938 M895 330 H945 M890 400 H950" stroke="#09090b" stroke-width="5"/>
      <path d="M0 540 L1280 440 L1280 720 L0 720 Z" fill="url(#road)"/>
      <path d="M0 580 L1280 480" stroke="#e11d48" stroke-width="3" stroke-opacity="0.7"/>
      <path d="M0 610 L1280 510" stroke="#fbbf24" stroke-width="2" stroke-opacity="0.45"/>
      <g transform="translate(260, 290)">
        <path d="M40 70 C50 45 78 45 88 70 L108 210 L20 210 Z" fill="#09090b"/>
        <circle cx="64" cy="42" r="20" fill="#111118"/>
        <path d="M22 86 L-12 225 L36 190 Z" fill="#18181b"/>
        <path d="M92 30 L16 250" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g stroke="#e4e4e7" stroke-opacity="0.18" stroke-width="1.5">
        <line x1="180" y1="60" x2="150" y2="180"/>
        <line x1="520" y1="40" x2="490" y2="160"/>
        <line x1="810" y1="80" x2="780" y2="200"/>
        <line x1="1120" y1="30" x2="1090" y2="150"/>
      </g>
    </svg>
  `),
  espada: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" fill="none">
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#131629"/>
          <stop offset="60%" stop-color="#3b1c2e"/>
          <stop offset="100%" stop-color="#111115"/>
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#bg1)"/>
      <circle cx="430" cy="180" r="82" fill="#fb7185" fill-opacity="0.22"/>
      <circle cx="430" cy="180" r="56" fill="#fda4af" fill-opacity="0.35"/>
      <path d="M0 590 Q180 480 360 560 T600 520 L600 800 L0 800 Z" fill="#0d0d12"/>
      <path d="M210 260 C250 220 330 220 360 270 L405 620 L185 620 Z" fill="#141624"/>
      <circle cx="290" cy="215" r="36" fill="#1a1c2e"/>
      <path d="M160 540 L485 265" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
      <path d="M160 540 L485 265" stroke="#fecdd3" stroke-width="2" stroke-linecap="round"/>
      <g fill="#f43f5e" fill-opacity="0.75">
        <ellipse cx="120" cy="210" rx="10" ry="4" transform="rotate(-25 120 210)"/>
        <ellipse cx="470" cy="390" rx="11" ry="4" transform="rotate(35 470 390)"/>
        <ellipse cx="145" cy="430" rx="8" ry="3" transform="rotate(15 145 430)"/>
        <ellipse cx="380" cy="140" rx="9" ry="3" transform="rotate(-40 380 140)"/>
      </g>
    </svg>
  `),
  orbita: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" fill="none">
      <defs>
        <linearGradient id="space" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#050814"/>
          <stop offset="100%" stop-color="#0d1b38"/>
        </linearGradient>
        <radialGradient id="earth" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="70%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#090d1f"/>
        </radialGradient>
      </defs>
      <rect width="600" height="800" fill="url(#space)"/>
      <circle cx="300" cy="590" r="340" fill="url(#earth)" opacity="0.88"/>
      <circle cx="300" cy="590" r="346" stroke="#7dd3fc" stroke-opacity="0.45" stroke-width="3"/>
      <ellipse cx="300" cy="300" rx="220" ry="70" transform="rotate(-18 300 300)" stroke="#e2e8f0" stroke-opacity="0.35" stroke-width="4"/>
      <circle cx="300" cy="310" r="130" stroke="#38bdf8" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="10 8"/>
      <rect x="265" y="235" width="70" height="120" rx="22" fill="#e2e8f0" fill-opacity="0.85"/>
      <circle cx="300" cy="205" r="28" fill="#f8fafc"/>
      <rect x="282" y="196" width="36" height="16" rx="8" fill="#0f172a"/>
      <g fill="#f8fafc" fill-opacity="0.7">
        <circle cx="95" cy="110" r="2"/>
        <circle cx="480" cy="95" r="2.5"/>
        <circle cx="150" cy="260" r="1.5"/>
        <circle cx="510" cy="230" r="2"/>
        <circle cx="240" cy="80" r="1.5"/>
      </g>
    </svg>
  `),
  alquimia: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" fill="none">
      <defs>
        <linearGradient id="lib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#141118"/>
          <stop offset="60%" stop-color="#291d14"/>
          <stop offset="100%" stop-color="#0d0b0e"/>
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#lib)"/>
      <circle cx="300" cy="270" r="150" stroke="#f59e0b" stroke-opacity="0.55" stroke-width="3"/>
      <circle cx="300" cy="270" r="110" stroke="#fbbf24" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="12 6"/>
      <ellipse cx="300" cy="270" rx="175" ry="52" transform="rotate(28 300 270)" stroke="#fcd34d" stroke-opacity="0.6" stroke-width="2.5"/>
      <ellipse cx="300" cy="270" rx="175" ry="52" transform="rotate(-28 300 270)" stroke="#fcd34d" stroke-opacity="0.6" stroke-width="2.5"/>
      <circle cx="300" cy="270" r="22" fill="#fbbf24" fill-opacity="0.85"/>
      <path d="M80 760 L80 220 A220 220 0 0 1 520 220 L520 760" stroke="#52525b" stroke-opacity="0.35" stroke-width="6"/>
      <path d="M250 470 C275 440 325 440 350 470 L385 730 L215 730 Z" fill="#18181b"/>
      <circle cx="300" cy="430" r="28" fill="#d4d4d8"/>
    </svg>
  `),
  velo: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" fill="none">
      <defs>
        <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0b1020"/>
          <stop offset="55%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#snow)"/>
      <path d="M350 115 A62 62 0 1 0 390 215 A48 48 0 1 1 350 115 Z" fill="#f8fafc" fill-opacity="0.9"/>
      <path d="M135 280 H465 L452 310 H148 Z" fill="#e11d48" fill-opacity="0.85"/>
      <rect x="175" y="345" width="250" height="22" fill="#be123c" fill-opacity="0.85"/>
      <rect x="200" y="310" width="24" height="310" fill="#9f1239"/>
      <rect x="376" y="310" width="24" height="310" fill="#9f1239"/>
      <path d="M0 620 L600 620 L600 800 L0 800 Z" fill="#e2e8f0" fill-opacity="0.14"/>
      <path d="M275 495 L325 495 L340 625 L260 625 Z" fill="#e11d48"/>
      <path d="M275 445 L325 445 L330 498 L270 498 Z" fill="#f8fafc"/>
      <circle cx="300" cy="422" r="20" fill="#f1f5f9"/>
    </svg>
  `),
  velocidad: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" fill="none">
      <defs>
        <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#070a10"/>
          <stop offset="60%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#night)"/>
      <path d="M0 320 L180 210 L340 290 L490 195 L600 280 L600 500 L0 500 Z" fill="#0f172a"/>
      <path d="M0 520 Q280 450 600 560 L600 800 L0 800 Z" fill="#18181b"/>
      <path d="M30 690 Q240 530 570 595" stroke="#e11d48" stroke-width="14" stroke-linecap="round" stroke-opacity="0.75"/>
      <path d="M60 725 Q265 565 585 620" stroke="#fb7185" stroke-width="5" stroke-linecap="round" stroke-opacity="0.8"/>
      <g transform="translate(215, 485) rotate(-10)">
        <rect x="0" y="25" width="170" height="48" rx="14" fill="#09090b" stroke="#52525b" stroke-width="2"/>
        <path d="M30 25 L62 4 L125 4 L152 25 Z" fill="#18181b" stroke="#52525b" stroke-width="2"/>
        <circle cx="24" cy="48" r="7" fill="#f43f5e"/>
        <circle cx="148" cy="48" r="7" fill="#f43f5e"/>
      </g>
    </svg>
  `),
};

export function resolvePosterSrc(posterKey: PosterKey, posterUrl?: string): string {
  if (posterUrl && (posterUrl.startsWith('http') || posterUrl.startsWith('/api/'))) {
    return posterUrl;
  }
  return POSTER_ASSETS[posterKey] || POSTER_ASSETS.espada;
}
