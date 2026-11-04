export default function OurMvp() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-primary text-bg">
      <div className="absolute right-0 top-0 h-full w-[22vw] bg-[#4b0578]" />
      <div className="absolute right-[7vw] top-[13vh] h-[74vh] w-[0.55vw] bg-[#f6e9c9]" />
      <h1 className="relative ml-[7vw] pt-[8vh] font-display text-[4.4vw] font-bold leading-none tracking-[-0.055em]">
        Our MVP
      </h1>
      <div className="relative ml-[7vw] mt-[5vh] w-[77vw]">
        <div className="flex items-start gap-[2vw] border-b border-[#8b55a5] py-[2.15vh]">
          <span className="mt-[1.1vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-[#f6e9c9]" />
          <p className="max-w-[69vw] text-[2.05vw] font-medium leading-[1.3]">
            Six restaurant menus in the prototype resembling D2
          </p>
        </div>
        <div className="flex items-start gap-[2vw] border-b border-[#8b55a5] py-[2.15vh]">
          <span className="mt-[1.1vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-[#f6e9c9]" />
          <p className="max-w-[69vw] text-[2.05vw] font-medium leading-[1.3]">
            10-minute slots from 11:30 AM to 1:30 PM, with up to five orders per slot
          </p>
        </div>
        <div className="flex items-start gap-[2vw] border-b border-[#8b55a5] py-[2.15vh]">
          <span className="mt-[1.1vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-[#f6e9c9]" />
          <p className="max-w-[69vw] text-[2.05vw] font-medium leading-[1.3]">
            Student and staff flows with menu editing, order updates, and pickup codes
          </p>
        </div>
        <div className="flex items-start gap-[2vw] py-[2.15vh]">
          <span className="mt-[1.1vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-[#f6e9c9]" />
          <p className="max-w-[69vw] text-[2.05vw] font-medium leading-[1.3]">
            Orders and menu edits persist in the shared app database
          </p>
        </div>
      </div>
    </div>
  );
}
