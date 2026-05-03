import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-navy mb-6" style={{ fontFamily: "Exo 2" }}>
          Terms & Privacy
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Coming soon. For inquiries email parts@masgroup.is.
        </p>
      </main>
      <Footer />
    </>
  );
}
