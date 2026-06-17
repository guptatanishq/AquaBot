import AquaBot from "@/components/AquaBot";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-8 font-(family-name:--font-geist-sans)">
      <div className="w-full flex justify-center drop-shadow-2xl">
        <AquaBot />
      </div>
    </div>
  );
}
