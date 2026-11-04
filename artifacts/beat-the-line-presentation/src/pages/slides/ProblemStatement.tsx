export default function ProblemStatement() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-primary text-bg">
      <div className="absolute right-0 top-0 h-full w-[23vw] bg-[#4b0578]" />
      <div className="absolute right-[10vw] top-[17vh] h-[66vh] w-[0.6vw] bg-[#f6e9c9]" />
      <div className="relative ml-[8vw] flex h-full w-[77vw] flex-col justify-center pb-[3vh]">
        <h1 className="font-display text-[4vw] font-bold leading-none tracking-[-0.055em] text-[#f6e9c9]">
          Problem statement
        </h1>
        <p className="mt-[6vh] max-w-[73vw] text-[5.15vw] font-medium leading-[1.13] tracking-[-0.045em] text-wrap-balance">
          How might we help students order from campus dining ahead of time while giving dining staff a clear, time-based prep queue?
        </p>
      </div>
    </div>
  );
}
