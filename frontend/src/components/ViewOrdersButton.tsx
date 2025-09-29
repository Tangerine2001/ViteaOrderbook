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
import {Order, OrderType, OrderKind, User} from "@/lib/interfaces";

interface ViewOrdersButtonProps {
    itemId: number;
    user: User | null;
}

export function ViewOrdersButton({itemId, user}: ViewOrdersButtonProps) {
    const [open, setOpen] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch all orders for the bar chart
    useEffect(() => {
        if (!open) return;

        async function fetchAllOrders() {
            try {
                const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/?item_id=${itemId}`;
                const res = await fetch(url);
                const data: Order[] = await res.json();
                setAllOrders(data);
            } catch (error) {
                console.error("Error fetching all orders:", error);
            }
        }

        fetchAllOrders();
    }, [open, itemId]);

    // Fetch user-specific orders for the list
    useEffect(() => {
        if (!open) return;

        async function fetchUserOrders() {
            setLoading(true);
            try {
                const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/?item_id=${itemId}${user ? `&user_id=${user.id}` : ''}`;
                const res = await fetch(url);
                const data: Order[] = await res.json();
                setOrders(data);
            } finally {
                setLoading(false);
            }
        }

        fetchUserOrders();
    }, [open, itemId, user]);

    async function handleDeleteOrder(orderId: number) {
        if (!confirm("Are you sure you want to delete this order?")) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/delete/`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    order_id: orderId
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Failed to delete order");
                return;
            }

            // Remove the deleted order from both states
            setOrders(orders.filter(order => order.id !== orderId));
            setAllOrders(allOrders.filter(order => order.id !== orderId));
        } catch (error) {
            console.error("Error deleting order:", error);
            alert("An error occurred while deleting the order");
        }
    }

    const bidCounts: Record<number, number> = {};
    const askCounts: Record<number, number> = {};
    let totalBids = 0;
    let totalAsks = 0;

    // Use allOrders for the bar chart data
    allOrders.forEach((order) => {
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

                <ResponsiveContainer width="100%" height={300}>
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

                {orders.length > 0 ? (
                    <div className="mt-4">
                        <h3 className="font-medium mb-2">Your Orders</h3>
                        <div className="border rounded-md divide-y">
                            {orders.map((order) => (
                                <div key={order.id} className="flex justify-between items-center p-2">
                                    <div>
                                        <span className={order.side === OrderType.Bid ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                            {order.side === OrderType.Bid ? "BID" : "ASK"}
                                        </span>
                                        <span className="mx-2">|</span>
                                        <span>{order.kind}: {order.price}</span>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDeleteOrder(order.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 text-center text-gray-500">
                        {loading ? "Loading orders..." : "No orders found"}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
