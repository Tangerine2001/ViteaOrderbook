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
import {Trade, User} from "@/lib/interfaces";

interface ViewTradesButtonProps {
    itemId: number;
}

export function ViewTradesButton({itemId}: ViewTradesButtonProps) {
    const [open, setOpen] = useState(false);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (!open) return;

        async function fetchTrades() {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/trades/?item_id=${itemId}`
            );
            const data: Trade[] = await res.json();
            setTrades(data);
        }

        async function fetchUsers() {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/`);
            const data: User[] = await res.json();
            setUsers(data);
        }

        fetchTrades();
        fetchUsers();
    }, [open, itemId]);

    const resolveUser = (userId: number) => {
        const user = users.find((u) => u.id === userId);
        return user ? user.name : "[User Deleted]";
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">View Trades</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Past Trades</DialogTitle>
                </DialogHeader>
                <div className="overflow-x-auto mt-4">
                    {trades.length === 0 ? (
                        <p className="text-gray-500">No trades yet.</p>
                    ) : (
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b">
                                <th className="p-2">Buyer</th>
                                <th className="p-2">Seller</th>
                                <th className="p-2">Price</th>
                            </tr>
                            </thead>
                            <tbody>
                            {trades.map((trade) => (
                                <tr key={trade.id} className="border-b">
                                    <td className="p-2">{resolveUser(trade.buyer_id)}</td>
                                    <td className="p-2">{resolveUser(trade.seller_id)}</td>
                                    <td className="p-2">${trade.price.toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
