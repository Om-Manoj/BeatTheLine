export default function TheProblem() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f8f4fa] text-[#321b40]">
      <div className="absolute right-0 top-0 h-full w-[16vw] bg-[#eee6f4]" />
      <div className="absolute right-[5.3vw] top-[13vh] h-[74vh] w-[0.55vw] bg-[#57068c]" />
      <div className="relative ml-[7vw] pt-[10vh]">
        <h1 className="font-display text-[4.4vw] font-bold leading-none tracking-[-0.055em]">
          The problem
        </h1>
        <div className="mt-[9vh] max-w-[76vw]">
          <div className="flex items-start gap-[2.5vw] border-b border-[#d8c9e1] py-[3.2vh]">
            <span className="mt-[1.15vh] h-[1.35vw] w-[1.35vw] shrink-0 rounded-full bg-[#57068c]" />
            <p className="max-w-[69vw] text-[2.15vw] font-medium leading-[1.35]">
              Students need a faster way to get their food from the dining halls during their limited breaks
            </p>
          </div>
          <div className="flex items-start gap-[2.5vw] border-b border-[#d8c9e1] py-[3.2vh]">
            <span className="mt-[1.15vh] h-[1.35vw] w-[1.35vw] shrink-0 rounded-full bg-[#57068c]" />
            <p className="max-w-[69vw] text-[2.15vw] font-medium leading-[1.35]">
              Dining staff need to know which orders are due, and when
            </p>
          </div>
          <div className="flex items-start gap-[2.5vw] py-[3.2vh]">
            <span className="mt-[1.15vh] h-[1.35vw] w-[1.35vw] shrink-0 rounded-full bg-[#57068c]" />
            <p className="max-w-[69vw] text-[2.15vw] font-medium leading-[1.35]">
              When ordering and pickup happen in one line, timing is hard to plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
