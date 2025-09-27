'use client'

import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import {Order, OrderType, OrderKind} from "@/lib/interfaces";

interface ViewOrdersButtonProps {
    itemId: number;
}

export function ViewOrdersButton({itemId}: ViewOrdersButtonProps) {
    const [open, setOpen] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (!open) return;

        async function fetchOrders() {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/orders/?item_id=${itemId}`
            );
            const data: Order[] = await res.json();
            setOrders(data);
        }

        fetchOrders();
    }, [open, itemId]);

    const bidCounts: Record<number, number> = {};
    const askCounts: Record<number, number> = {};
    let totalBids = 0;
    let totalAsks = 0;

    orders.forEach((order) => {
        if (order.kind !== OrderKind.Limit) return; // ignore Market orders
        if (order.price == null) return;

        if (order.side === OrderType.Bid) {
            bidCounts[order.price] = (bidCounts[order.price] || 0) + 1;
            totalBids++;
        } else if (order.side === OrderType.Ask) {
            askCounts[order.price] = (askCounts[order.price] || 0) + 1;
            totalAsks++;
        }
    });

    const uniquePrices = Array.from(
        new Set([...Object.keys(bidCounts), ...Object.keys(askCounts)])
    ).sort((a, b) => parseFloat(a) - parseFloat(b));

    const data = uniquePrices.map((price) => ({
        price,
        bidQty: bidCounts[parseFloat(price)] || 0,
        askQty: askCounts[parseFloat(price)] || 0,
    }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">View Orders</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Orders</DialogTitle>
                </DialogHeader>

                <div className="flex justify-around text-sm font-medium mb-4">
                    <span className="text-green-600">Total Bids: {totalBids}</span>
                    <span className="text-red-600">Total Asks: {totalAsks}</span>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="price"
                            label={{value: "Price", position: "insideBottom", offset: -5}}
                        />
                        <YAxis
                            label={{value: "Quantity", angle: -90, position: "insideLeft"}}
                        />
                        <Tooltip/>
                        <Legend/>
                        <Bar dataKey="bidQty" name="Bids" fill="#22c55e"/>
                        <Bar dataKey="askQty" name="Asks" fill="#ef4444"/>
                    </BarChart>
                </ResponsiveContainer>
            </DialogContent>
        </Dialog>
    );
}
