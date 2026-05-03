import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/thank-you")({
  component: ThankYou,
});

function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-mas-orange flex items-center justify-center">
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-black text-navy mb-3" style={{ fontFamily: "Exo 2" }}>
          Thanks! We got your request.
        </h1>
        <p className="text-muted-foreground mb-8">
          Our team will reply within a few hours with a quote.
        </p>
        <Link to="/" className="btn-glow inline-block px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider">
          Back to home
        </Link>
      </div>
    </div>
  );
}
