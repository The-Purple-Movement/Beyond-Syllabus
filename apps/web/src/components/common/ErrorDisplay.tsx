import { Header } from "./Header";


interface ErrorDisplayProps {
  errorMessage: string;
}

export default function ErrorDisplay({ errorMessage }: ErrorDisplayProps) {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20 flex justify-center items-center h-screen">
        <div className="max-w-3xl mx-auto text-center text-destructive">
          <h1 className="text-3xl font-bold mb-4">Error Loading Data</h1>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border rounded-md"
          >
            Retry
          </button>
        </div>
      </main>
    </>
  );
}
