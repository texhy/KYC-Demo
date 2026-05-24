/**
 * DCF — Direct Credit Funding wordmark, recreated as SVG so it stays crisp at any
 * size and works on the dark navy sidebar. Colors come from the brand logo:
 * D = grey, C = crimson, F = teal, framed by a corner bracket with an arrow.
 */
export default function DcfLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} role="img" aria-label="Direct Credit Funding">
      {/* corner-bracket frame */}
      <path
        d="M14 8 H70 M8 14 V58 M226 8 H170 M232 14 V58"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="square"
        fill="none"
      />
      {/* bottom bracket + arrow */}
      <path
        d="M8 96 V128 H150"
        stroke="#ffffff"
        strokeWidth="5"
        fill="none"
      />
      <path d="M150 120 l16 8 l-16 8 z" fill="#a6dcd8" />

      {/* DCF wordmark */}
      <text
        x="50%"
        y="74"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="56"
        letterSpacing="2"
      >
        <tspan fill="#9aa0a6">D</tspan>
        <tspan fill="#a4123f">C</tspan>
        <tspan fill="#a6dcd8">F</tspan>
      </text>

      {/* tagline */}
      <text
        x="50%"
        y="118"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="600"
        fontSize="13"
        letterSpacing="4"
        fill="#cbd5e1"
      >
        DIRECT CREDIT FUNDING
      </text>
    </svg>
  );
}
