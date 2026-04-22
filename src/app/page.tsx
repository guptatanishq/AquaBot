import AquaBot from "@/components/AquaBot";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600 tracking-tight mb-3">
          AquaBot Live Demo
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          This is the standalone embeddable chat component. You can inject this direct chat interface widget anywhere into your system software!
        </p>
      </div>

      <div className="w-full flex justify-center drop-shadow-2xl">
        <AquaBot />
      </div>
    </div>
  );
}
