"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Never wonder{" "}
            <span className="text-primary">&quot;where next?&quot;</span>{" "}
            again
          </h1>
          <p className="text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
            Plan your perfect NYC outing with smart suggestions that factor in distance, budget, and vibe. Build step-by-step or generate a full itinerary in seconds.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Button size="lg" className="text-base px-8" onClick={() => router.push("/plan/new")}>
              Start Planning
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}>
              How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-lg">Pick Your First Spot</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Search for any place in NYC or let us suggest one based on your vibe and budget.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-lg">Get Smart Suggestions</h3>
              <p className="text-sm text-muted-foreground mt-2">
                We suggest nearby places within walking or transit distance that fit your remaining budget.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-lg">Save & Share</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Save your itinerary for later, share it with friends, or use it as inspiration for your next outing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Built for NYC</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Budget Aware</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set your total budget and watch suggestions adapt in real-time as you add stops.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <circle cx="12" cy="4" r="2"/>
                    <path d="M13.5 6.5l2 4.5-3.5 2 1 5.5-3 1.5-.5-4-2.5-1.5V10l3-1.5"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Walk or Ride</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Toggle between walking and subway/bus distances to find the perfect next stop.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Category Variety</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our suggestions prioritize variety so you don&apos;t end up at three coffee shops in a row.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Two Modes</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Build step-by-step when you like control, or generate a full plan when you want inspiration.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Ready to plan your next outing?</h2>
          <p className="text-muted-foreground mt-3">
            No sign-up required to start planning. Create an account to save your favorites.
          </p>
          <Button size="lg" className="mt-6 text-base px-8" onClick={() => router.push("/plan/new")}>
            Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="font-semibold text-sm">NextStop NYC</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for New Yorkers who hate saying &quot;I don&apos;t know, where do you want to go?&quot;
          </p>
        </div>
      </footer>
    </div>
  );
}
