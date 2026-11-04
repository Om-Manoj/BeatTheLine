export default function HowItWorks() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-primary text-bg">
      <div className="absolute right-0 top-0 h-full w-[18vw] bg-[#4b0578]" />
      <h1 className="relative ml-[7vw] pt-[7vh] font-display text-[4.2vw] font-bold leading-none tracking-[-0.055em]">
        How it works
      </h1>
      <div className="relative ml-[7vw] mt-[6vh] w-[81vw]">
        <div className="relative min-h-[31vh] rounded-[1.5vw] bg-[#eee6f4] px-[2.6vw] py-[3vh] text-[#321b40]">
          <p className="max-w-[75vw] text-[2vw] font-medium leading-[1.3]">
            Student: choose a restaurant → add items → select a pickup slot → enter a name and payment choice → get a pickup code
          </p>
          <div className="absolute bottom-[6vh] left-[4vw] right-[4vw] h-[0.35vh] bg-[#57068c]" />
          <span className="absolute bottom-[4.6vh] left-[5vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
          <span className="absolute bottom-[4.6vh] left-[23vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
          <span className="absolute bottom-[4.6vh] left-[41vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
          <span className="absolute bottom-[4.6vh] left-[59vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
          <span className="absolute bottom-[4.6vh] right-[4vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f6e9c9]" />
        </div>
        <div className="relative mt-[3vh] min-h-[31vh] rounded-[1.5vw] bg-[#f6e9c9] px-[2.6vw] py-[3vh] text-[#321b40]">
          <p className="max-w-[75vw] text-[2vw] font-medium leading-[1.3]">
            Dining staff: sign in → monitor orders by slot → update order status → edit menus for students
          </p>
          <div className="absolute bottom-[6vh] left-[4vw] right-[4vw] h-[0.35vh] bg-[#57068c]" />
          <span className="absolute bottom-[4.6vh] left-[7vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
          <span className="absolute bottom-[4.6vh] left-[27vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
          <span className="absolute bottom-[4.6vh] left-[47vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
          <span className="absolute bottom-[4.6vh] right-[4vw] h-[3vw] w-[3vw] rounded-full border-[0.35vw] border-[#57068c] bg-[#f8f4fa]" />
        </div>
      </div>
    </div>
  );
}
