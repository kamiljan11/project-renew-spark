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
          Thanks! Request received ✅
        </h1>
        <p className="text-muted-foreground mb-2">
          We'll review your request and reply with a price by <strong>email and phone</strong>.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          ⏱️ Typical reply time: <strong>within a few business hours</strong> (Mon–Fri, 9–17 GMT).
          <br />
          Sent outside hours? You'll hear from us first thing next business day.
        </p>
        <Link
          to="/"
          className="btn-glow inline-block px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
