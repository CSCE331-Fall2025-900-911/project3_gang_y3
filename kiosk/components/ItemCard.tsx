"use client";
import React from 'react';

type Item = { id: number | null; name: string; price: number; category?: string | null };

export default function ItemCard({ item, onAdd }: { item: Item; onAdd: (it: Item) => void }) {
  return (
    <div className="border rounded p-3 flex flex-col text-black">
      <div className="font-medium text-black">{item.name}</div>
      <div className="text-sm text-black/70">{item.category}</div>
      <div className="mt-2 flex items-center justify-between">
  <div className="font-semibold text-black">${item.price.toFixed(2)}</div>
        <button
          className="ml-4 rounded bg-foreground px-3 py-1 text-sm text-background hover:opacity-90"
          onClick={() => onAdd(item)}
        >
          Add
        </button>
      </div>
    </div>
  );
}
