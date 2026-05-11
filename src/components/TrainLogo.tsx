export const TrainLogo = () => (
    <svg
        viewBox="8 10 140 102"
        width={56}
        height={40}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ overflow: "visible", transform: "scaleX(-1)" }}
    >
        {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={i * 40 - 20} y={103} width={16} height={6} rx={1} className="fill-havvind-300" />
        ))}

        <rect x={0} y={100} width={160} height={3} rx={1} className="fill-havvind-600" />
        <rect x={0} y={107} width={160} height={3} rx={1} className="fill-havvind-600" />

        <rect x={24} y={83} width={116} height={8} rx={3} className="fill-havvind-900" />

        <rect x={30} y={38} width={95} height={47} rx={5} className="fill-havvind-800" />
        <rect x={30} y={79} width={95} height={4} className="fill-havvind-900" />

        <ellipse cx={80} cy={38} rx={14} ry={7} className="fill-havvind-900" />

        <rect x={50} y={18} width={10} height={22} rx={2} className="fill-havvind-950" />
        <rect x={47} y={14} width={16} height={6} rx={2} className="fill-havvind-950" />

        <rect x={105} y={42} width={28} height={43} rx={3} className="fill-havvind-700" />
        <rect x={105} y={79} width={28} height={4} className="fill-havvind-900" />
        <rect x={108} y={50} width={11} height={11} rx={2} fill="white" opacity={0.92} />
        <rect x={122} y={50} width={11} height={11} rx={2} fill="white" opacity={0.92} />
        <rect x={108} y={50} width={4} height={3} rx={1} fill="white" opacity={0.5} />
        <rect x={122} y={50} width={4} height={3} rx={1} fill="white" opacity={0.5} />

        <rect x={24} y={40} width={9} height={45} rx={3} className="fill-havvind-900" />

        <circle cx={28} cy={63} r={11} fill="#fef3c7" opacity={0.18}
            style={{ animation: "headlight-flicker 2.5s ease-in-out infinite" }} />
        <circle cx={28} cy={63} r={5} fill="#fef3c7" opacity={0.95}
            style={{ animation: "headlight-flicker 2.5s ease-in-out infinite" }} />

        <rect x={12} y={76} width={13} height={6} rx={2} className="fill-havvind-600" />

        {[50, 90].map((cx) => (
            <g key={cx} style={{ transformBox: "fill-box", transformOrigin: "center", animation: "wheel-spin 0.6s linear infinite" }}>
                <circle cx={cx} cy={97} r={10} className="fill-havvind-900" />
                <circle cx={cx} cy={97} r={6.5} className="fill-havvind-800" />
                <line x1={cx - 6} y1={97} x2={cx + 6} y2={97} className="stroke-havvind-500" strokeWidth={1.5} />
                <line x1={cx} y1={91} x2={cx} y2={103} className="stroke-havvind-500" strokeWidth={1.5} />
                <line x1={cx - 4} y1={93} x2={cx + 4} y2={101} className="stroke-havvind-500" strokeWidth={1} />
                <line x1={cx + 4} y1={93} x2={cx - 4} y2={101} className="stroke-havvind-500" strokeWidth={1} />
                <circle cx={cx} cy={97} r={2.5} className="fill-havvind-300" />
            </g>
        ))}
    </svg>
);
