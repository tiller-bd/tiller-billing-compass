"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Loader2, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddClientDialogProps {
  onClientAdded: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

interface ClientFormData {
  name: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export function AddClientDialog({
  onClientAdded,
  open: controlledOpen,
  setOpen: controlledSetOpen,
}: AddClientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    defaultValues: {
      name: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create client");
      }

      toast.success("Client created successfully");
      setOpen(false);
      reset();
      onClientAdded();
    } catch (err: any) {
      toast.error(err.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-bold shadow-md hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Register New Client
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">
              Client Name *
            </Label>
            <Input
              {...register("name", { required: "Client name is required" })}
              placeholder="Enter client/organization name"
              className="h-11 font-bold"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">
              Contact Person
            </Label>
            <Input
              {...register("contactPerson")}
              placeholder="Primary contact name"
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                Email
              </Label>
              <Input
                type="email"
                {...register("contactEmail")}
                placeholder="email@example.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                Phone
              </Label>
              <Input
                {...register("contactPhone")}
                placeholder="+880 1XXX-XXXXXX"
                className="h-11"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 font-bold"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 font-black uppercase"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
