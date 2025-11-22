import { Header } from "./Header";
import { ErrorDisplayProps } from "@/lib/types";
import { Button } from "./ui/button";

export default function ErrorDisplay({ errorMessage }: ErrorDisplayProps) {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20 flex justify-center items-center h-screen">
        <div className="max-w-3xl mx-auto text-center text-destructive">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Error Loading Data</h1>
          <p className="text-muted-foreground text-red-500  mb-4">{errorMessage}</p>
          <Button
            variant={"outline"}
            onClick={() => window.location.reload()}
            className="px-4 py-2 border rounded-md text-red-500 hover:text-red-700"
          >
            Retry
          </Button>
        </div>
      </main>
    </>
  );
}
