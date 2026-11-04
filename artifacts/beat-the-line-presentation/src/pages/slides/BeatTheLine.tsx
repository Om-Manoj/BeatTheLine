export default function BeatTheLine() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-primary text-bg">
      <div className="absolute inset-y-0 right-0 w-[43vw] bg-[#4b0578]" />
      <div className="absolute right-[5vw] top-[9vh] h-[82vh] w-[34vw] rounded-[18vw] border-[0.7vw] border-[#7b36a4]" />
      <div className="absolute right-[9vw] top-[16vh] h-[68vh] w-[26vw] rounded-[14vw] bg-[#eee6f4]" />
      <div className="absolute right-[13vw] top-[23vh] h-[54vh] w-[18vw] rounded-[9vw] bg-[#f8f4fa] shadow-[0_2vw_5vw_rgba(25,4,42,0.2)]">
        <div className="absolute left-[6.7vw] top-[3vh] h-[0.7vh] w-[4.5vw] rounded-full bg-[#d9c6e4]" />
        <div className="absolute left-[2vw] top-[9vh] h-[8vh] w-[14vw] rounded-[1.5vw] bg-[#57068c]" />
        <div className="absolute left-[3vw] top-[11vh] h-[0.8vh] w-[8vw] rounded-full bg-[#eee6f4]" />
        <div className="absolute left-[3vw] top-[13vh] h-[0.7vh] w-[5vw] rounded-full bg-[#d5bce2]" />
        <div className="absolute left-[2vw] top-[20vh] h-[5vh] w-[14vw] rounded-[1vw] bg-[#eee6f4]" />
        <div className="absolute left-[2vw] top-[27vh] h-[5vh] w-[14vw] rounded-[1vw] bg-[#eee6f4]" />
        <div className="absolute left-[2vw] top-[37vh] h-[8vh] w-[14vw] rounded-[1.5vw] bg-[#f6e9c9]" />
        <div className="absolute left-[4vw] top-[40vh] h-[2vh] w-[7vw] rounded-full bg-[#321b40]" />
      </div>
      <div className="absolute left-[7vw] top-[11vh] max-w-[55vw]">
        <p className="font-display text-[6.7vw] font-bold leading-[0.98] tracking-[-0.065em] text-wrap-balance">
          BeatTheLine
        </p>
        <p className="mt-[3.2vh] max-w-[42vw] text-[2.55vw] font-medium leading-[1.2] text-[#eee6f4]">
          Campus dining, without the line.
        </p>
        <p className="mt-[2.2vh] max-w-[37vw] text-[2vw] leading-[1.35] text-[#e2d2ec]">
          A university dining pre-order prototype
        </p>
        <p className="mt-[12vh] text-[1.8vw] font-bold tracking-[0.01em] text-[#f6e9c9]">
          Presented by Om &amp; Aliyan
        </p>
      </div>
      <div className="absolute bottom-[8vh] left-[7vw] h-[0.6vh] w-[8vw] bg-[#f6e9c9]" />
    </div>
  );
}
