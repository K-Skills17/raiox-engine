import BatchForm from "@/components/BatchForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-heading text-5xl text-gold mb-3">
            Raio-X Engine
          </h1>
          <p className="text-muted-foreground text-lg">
            Cole ate 20 URLs. Receba scripts filmaveis em 90 segundos.
          </p>
        </div>
        <BatchForm />
      </div>
    </main>
  );
}
