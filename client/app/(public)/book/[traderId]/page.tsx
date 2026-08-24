import { Metadata } from "next";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { getTrader } from "@/lib/api/endpoints";

interface Props {
  params: Promise<{ traderId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { traderId } = await params;
  try {
    const trader = await getTrader(traderId);
    return {
      title: `Book with ${trader.name} - TradeSlot`,
      description: `Book a slot with ${trader.name}`,
    };
  } catch {
    return {
      title: "Book a Slot - TradeSlot",
    };
  }
}

export default async function BookingPage({ params }: Props) {
  const { traderId } = await params;

  let traderName = "Trader";
  try {
    const trader = await getTrader(traderId);
    traderName = trader.name;
  } catch {
    // Trader not found, will show error in ChatWindow
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">TradeSlot</h1>
          <div className="text-right">
            <p className="text-sm font-medium">Booking with {traderName}</p>
            <p className="text-xs text-muted-foreground">Chat to find a slot</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <ChatWindow traderId={traderId} />
      </main>
    </div>
  );
}