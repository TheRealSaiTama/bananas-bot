export default function ThemeBackground() {
  // Matches the homepage blurred blob aesthetic; kept lightweight and reusable
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {/* Purple blob top right */}
      <div
        className="absolute w-[506px] h-[526px] rounded-full"
        style={{
          background: '#E622F6',
          filter: 'blur(275px)',
          right: '-261px',
          top: '-221px'
        }}
      />
      {/* Blue blob left */}
      <div
        className="absolute w-[506px] h-[526px] rounded-full"
        style={{
          background: '#38BEFB',
          filter: 'blur(275px)',
          left: '-522px',
          top: '707px'
        }}
      />
      {/* Small blue center */}
      <div
        className="absolute w-[162px] h-[152px] rounded-full"
        style={{
          background: '#646CFC',
          filter: 'blur(150px)',
          left: '593px',
          top: '1027px'
        }}
      />
      {/* Orange blob bottom right */}
      <div
        className="absolute w-[326px] h-[386px] rounded-full"
        style={{
          background: '#FFB21F',
          filter: 'blur(275px)',
          right: '-54px',
          bottom: '0px'
        }}
      />
      {/* Purple blob bottom left */}
      <div
        className="absolute w-[326px] h-[386px] rounded-full"
        style={{
          background: '#D884F2',
          filter: 'blur(275px)',
          left: '-54px',
          bottom: '200px'
        }}
      />
    </div>
  )
}

