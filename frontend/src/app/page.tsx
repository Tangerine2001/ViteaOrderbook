'use client'

import React, {useState, useEffect} from "react";
import {User, Item} from "@/lib/interfaces";
import {UserSelect} from "@/components/UserSelect";
import {AddUserButton} from "@/components/AddUserButton";
import {AddItemButton} from "@/components/AddItemButton";
import {ItemCard} from "@/components/ItemCard";

export default function Dashboard() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        async function fetchItems() {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/`);
            const data: Item[] = await res.json();
            setItems(data);
        }

        fetchItems();
    }, []);

    function handleItemAdded(newItem: Item) {
        setItems((prev) => [...prev, newItem]);
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
                <h1 className="text-xl font-bold">Vitea Orderbook</h1>
                <div className="flex items-center space-x-2">
                    <UserSelect selectedUser={selectedUser} onChange={setSelectedUser}/>
                    <AddUserButton onUserAdded={setSelectedUser}/>
                    <AddItemButton onItemAdded={handleItemAdded}/>
                </div>
            </header>

            {/* Dashboard Grid */}
            <main className="flex-1 p-6 bg-gray-50">
                {selectedUser && (
                    <>
                        <h2 className="text-lg font-semibold mb-4">
                            Viewing items for <span className="font-bold">{selectedUser.name}</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map((item) => (
                                <ItemCard key={item.id} item={item} user={selectedUser}/>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
