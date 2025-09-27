import React, {useEffect, useState} from "react";
import {Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from "@/components/ui/select";
import {User} from "@/lib/interfaces";


interface UserSelectProps {
    selectedUser: User | null;
    onChange: (user: User) => void;
}


export function UserSelect({selectedUser, onChange}: UserSelectProps) {
    const [users, setUsers] = useState<User[]>([]);


    useEffect(() => {
        async function fetchUsers() {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/`);
            const data: User[] = await res.json();
            setUsers(data);
            if (!selectedUser && data.length > 0) {
                onChange(data[0]);
            }
        }

        fetchUsers();
    }, [onChange, selectedUser]);


    return (
        <Select
            value={selectedUser?.id.toString()}
            onValueChange={(val) => {
                const user = users.find((u) => u.id.toString() === val);
                if (user) onChange(user);
            }}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select User"/>
            </SelectTrigger>
            <SelectContent>
                {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}