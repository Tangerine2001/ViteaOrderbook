import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Item} from "@/lib/interfaces";


interface AddItemButtonProps {
    onItemAdded: (item: Item) => void;
}


export function AddItemButton({onItemAdded}: AddItemButtonProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");


    async function handleAdd() {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name, description}),
        });
        const newItem: Item = await res.json();
        onItemAdded(newItem);
        setName("");
        setDescription("");
        setOpen(false);
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Item</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-2 mt-4">
                    <Input
                        placeholder="Item name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Button onClick={handleAdd}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}