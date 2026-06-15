"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReceiptActions() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      <Download className="h-4 w-4" /> Download / Print receipt
    </Button>
  );
}
