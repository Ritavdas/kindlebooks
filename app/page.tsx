import { Suspense } from "react";
import { getShelves } from "@/lib/shelves";
import HomeClient from "./HomeClient";

async function ShelvesGate() {
  const shelves = await getShelves();
  return <HomeClient initialShelves={shelves} />;
}

export default function Page() {
  return (
    <Suspense fallback={<HomeClient initialShelves={[]} />}>
      <ShelvesGate />
    </Suspense>
  );
}
