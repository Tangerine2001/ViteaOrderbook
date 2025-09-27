import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from "@/components/ui/select";
import {Order, OrderType, User} from "@/lib/interfaces";

interface CreateOrderButtonProps {
    itemId: number;
    user: User | null;
    onOrderCreated: (order: Order) => void;
}

export function CreateOrderButton({itemId, user, onOrderCreated}: CreateOrderButtonProps) {
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState("");
    const [orderType, setOrderType] = useState<OrderType>(OrderType.Bid);

    async function handleCreate() {
        if (!user) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                type: orderType,
                item_id: itemId,
                user_id: user.id,
                price: parseFloat(price),
            }),
        });
        const newOrder: Order = await res.json();
        onOrderCreated(newOrder);
        setPrice("");
        setOrderType(OrderType.Bid);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="cursor-pointer">Create Order</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Order</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-2 mt-4">
                    <Select value={orderType} onValueChange={(val) => setOrderType(val as OrderType)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Type"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={OrderType.Bid}>Bid</SelectItem>
                            <SelectItem value={OrderType.Ask}>Ask</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                    <Button onClick={handleCreate} disabled={!user}>Submit</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}