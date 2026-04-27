"use client";

import AddMilkForm from "@/components/milk/AddMilkForm";

export default function AddMilkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Milk Entry</h1>
        <p className="text-muted-foreground mt-1">Record morning or evening milk collections.</p>
      </div>
      
      <div className="mt-8">
        <AddMilkForm />
      </div>
    </div>
  );
}
