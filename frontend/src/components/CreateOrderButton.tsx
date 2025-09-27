'use client'

import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import {Order, OrderType, OrderKind, User} from "@/lib/interfaces";

interface CreateOrderButtonProps {
    itemId: number;
    user: User | null;
    onOrderCreated: (order: Order) => void;
}

export function CreateOrderButton({
                                      itemId,
                                      user,
                                      onOrderCreated,
                                  }: CreateOrderButtonProps) {
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState("");
    const [side, setSide] = useState<OrderType>(OrderType.Bid);
    const [kind, setKind] = useState<OrderKind>(OrderKind.Limit);
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        if (!user) return;
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    side,
                    kind,
                    item_id: itemId,
                    user_id: user.id,
                    price: kind === OrderKind.Limit ? parseFloat(price) : 0,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Failed to place order");
                return;
            }

            const newOrder: Order = await res.json();
            onOrderCreated(newOrder);
        } finally {
            setLoading(false);
            setPrice("");
            setSide(OrderType.Bid);
            setKind(OrderKind.Limit);
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary">Create Order</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Order</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-2 mt-4">
                    {/* Order Kind (Limit / Market) */}
                    <Select
                        value={kind}
                        onValueChange={(val) => setKind(val as OrderKind)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Order Kind"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={OrderKind.Limit}>Limit</SelectItem>
                            <SelectItem value={OrderKind.Market}>Market</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Side (Bid / Ask) */}
                    <Select
                        value={side}
                        onValueChange={(val) => setSide(val as OrderType)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Order Side"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={OrderType.Bid}>Bid (Buy)</SelectItem>
                            <SelectItem value={OrderType.Ask}>Ask (Sell)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Price only for Limit orders */}
                    {kind === OrderKind.Limit && (
                        <Input
                            placeholder="Price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    )}

                    <Button onClick={handleCreate} disabled={!user || loading}>
                        {loading
                            ? "Submitting..."
                            : kind === OrderKind.Limit
                                ? "Submit Limit Order"
                                : "Submit Market Order"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
