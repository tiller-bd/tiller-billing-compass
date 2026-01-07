"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Loader2, Building2, User, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AddClientDialog({ onClientAdded }: { onClientAdded: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            name: "",
            contactPerson: "",
            contactEmail: "",
            contactPhone: ""
        }
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Failed to create client");

            toast.success("Client successfully registered in the ecosystem");
            setOpen(false);
            reset();
            onClientAdded();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 font-black uppercase tracking-wider shadow-lg shadow-primary/20">
                    <Plus size={16} /> New Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Building2 className="text-primary" /> Register New Client
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Company / Entity Name</Label>
                        <Input {...register("name")} placeholder="e.g. Acme Corporation Ltd." className="h-11 font-bold" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                <User size={10} /> Contact Person
                            </Label>
                            <Input {...register("contactPerson")} placeholder="John Doe" className="h-10" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                <Phone size={10} /> Contact No
                            </Label>
                            <Input {...register("contactPhone")} placeholder="+880..." className="h-10" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                            <Mail size={10} /> Official Email
                        </Label>
                        <Input type="email" {...register("contactEmail")} placeholder="billing@acme.com" className="h-10" />
                    </div>

                    <Button type="submit" className="w-full h-12 text-sm font-black uppercase tracking-widest" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Onboard Client"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}