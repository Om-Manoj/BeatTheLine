export default function Features() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f8f4fa] text-[#321b40]">
      <div className="absolute left-0 top-0 h-[1.25vh] w-full bg-[#57068c]" />
      <h1 className="ml-[7vw] pt-[9vh] font-display text-[4.4vw] font-bold leading-none tracking-[-0.055em]">
        Features
      </h1>
      <div className="ml-[7vw] mt-[9vh] grid w-[86vw] grid-cols-2 gap-x-[7vw] gap-y-[7vh]">
        <div className="border-t-[0.35vh] border-[#57068c] pt-[2.3vh]">
          <span className="mb-[1.5vh] block h-[1.3vw] w-[1.3vw] rounded-full bg-[#57068c]" />
          <p className="max-w-[37vw] text-[2.05vw] font-medium leading-[1.34]">
            Build a cart with item quantities, availability, and vegetarian labels
          </p>
        </div>
        <div className="border-t-[0.35vh] border-[#57068c] pt-[2.3vh]">
          <span className="mb-[1.5vh] block h-[1.3vw] w-[1.3vw] rounded-full bg-[#57068c]" />
          <p className="max-w-[37vw] text-[2.05vw] font-medium leading-[1.34]">
            Choose whole meal swipes at, Flex Dirhams, or Campus Dirhams
          </p>
        </div>
        <div className="border-t-[0.35vh] border-[#57068c] pt-[2.3vh]">
          <span className="mb-[1.5vh] block h-[1.3vw] w-[1.3vw] rounded-full bg-[#f6e9c9]" />
          <p className="max-w-[37vw] text-[2.05vw] font-medium leading-[1.34]">
            Combine meal swipes with a dirham balance for the remainder; unused swipe value is discarded
          </p>
        </div>
        <div className="border-t-[0.35vh] border-[#57068c] pt-[2.3vh]">
          <span className="mb-[1.5vh] block h-[1.3vw] w-[1.3vw] rounded-full bg-[#f6e9c9]" />
          <p className="max-w-[37vw] text-[2.05vw] font-medium leading-[1.34]">
            NetID and payment are demo previews; no real balance check or charge
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 h-[13vh] w-[23vw] bg-[#eee6f4]" />
    </div>
  );
}
