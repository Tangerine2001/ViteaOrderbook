import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {User} from "@/lib/interfaces";


interface AddUserButtonProps {
    onUserAdded: (user: User) => void;
}


export function AddUserButton({onUserAdded}: AddUserButtonProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");


    async function handleAdd() {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name}),
        });
        const newUser: User = await res.json();
        console.log(newUser)
        onUserAdded(newUser);
        setName("");
        setOpen(false);
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="flex space-x-2 mt-4">
                    <Input
                        placeholder="User name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Button onClick={handleAdd}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}