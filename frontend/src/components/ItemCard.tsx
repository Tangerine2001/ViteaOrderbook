'use client'

import React, {useEffect, useState} from "react";
import {Card, CardContent} from "@/components/ui/card";
import {Item, Order, OrderType, Trade, User} from "@/lib/interfaces";
import {CreateOrderButton} from "@/components/CreateOrderButton";
import {ViewOrdersButton} from "@/components/ViewOrdersButton";
import {ViewTradesButton} from "@/components/ViewTradesButton";

interface ItemCardProps {
    item: Item;
    user: User | null;
}

export function ItemCard({item, user}: ItemCardProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [avgPrice, setAvgPrice] = useState<string>("Loading...");
    const [stats, setStats] = useState({
        tradeCount: 0,
        avgTradePrice: "N/A",
        unmatchedOrders: 0,
    });

    // Fetch orders + trades
    useEffect(() => {
        async function fetchOrders() {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/?item_id=${item.id}`);
            const data: Order[] = await res.json();
            setOrders(data);
            updateOrderPrice(data);
        }

        async function fetchTrades() {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trades/?item_id=${item.id}`);
            const data: Trade[] = await res.json();
            setTrades(data);
            updateTradeStats(data);
        }

        fetchOrders();
        fetchTrades();
    }, [item.id]);

    // Update displayed “market price” (highest bid + lowest ask average)
    function updateOrderPrice(data: Order[]) {
        if (data.length === 0) {
            setAvgPrice("no orders");
            return;
        }
        const bids = data.filter((o) => o.type === OrderType.Bid).map((o) => o.price);
        const asks = data.filter((o) => o.type === OrderType.Ask).map((o) => o.price);
        const highestBid = bids.length > 0 ? Math.max(...bids) : null;
        const lowestAsk = asks.length > 0 ? Math.min(...asks) : null;
        if (highestBid !== null && lowestAsk !== null) {
            setAvgPrice(((highestBid + lowestAsk) / 2).toFixed(2));
        } else if (highestBid !== null) {
            setAvgPrice(highestBid.toFixed(2));
        } else if (lowestAsk !== null) {
            setAvgPrice(lowestAsk.toFixed(2));
        } else {
            setAvgPrice("no orders");
        }
    }

    // Update stats from trades
    function updateTradeStats(trades: Trade[]) {
        if (trades.length === 0) {
            setStats({
                tradeCount: 0,
                avgTradePrice: "N/A",
                unmatchedOrders: orders.length,
            });
            return;
        }

        const avgTradePrice =
            trades.reduce((sum, t) => sum + t.price, 0) / trades.length;

        setStats({
            tradeCount: trades.length,
            avgTradePrice: avgTradePrice.toFixed(2),
            unmatchedOrders: Math.max(orders.length - trades.length, 0),
        });
    }

    // When a new order is created
    function handleOrderCreated(order: Order) {
        const updated = [...orders, order];
        setOrders(updated);
        updateOrderPrice(updated);
        updateTradeStats(trades); // refresh stats with updated unmatched orders
    }

    return (
        <Card className="rounded-2xl shadow hover:shadow-md transition">
            <CardContent className="p-4 flex flex-col space-y-3">
                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>

                {/* Market Price */}
                <p className="text-sm font-medium text-gray-800">
                    Market Price: {avgPrice}
                </p>

                {/* Stats */}
                <div className="text-sm text-gray-700 space-y-1">
                    <p>Trades Executed: <span className="font-semibold">{stats.tradeCount}</span></p>
                    <p>Average Trade Price: <span className="font-semibold">{stats.avgTradePrice}</span></p>
                    <p>Unmatched Orders: <span className="font-semibold">{stats.unmatchedOrders}</span></p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                    <CreateOrderButton itemId={item.id} user={user} onOrderCreated={handleOrderCreated}/>
                    <ViewOrdersButton itemId={item.id}/>
                    <ViewTradesButton itemId={item.id}/>
                </div>
            </CardContent>
        </Card>
    );
}
