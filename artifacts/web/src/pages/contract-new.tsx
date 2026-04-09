import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateContract, getListContractsQueryKey, useListWorkers, getListWorkersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  workerId: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  contractType: z.enum(["full_time", "part_time", "fixed_term", "indefinite", "freelance"]),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().optional(),
  currency: z.string().min(3, "Required"),
  compensation: z.string().min(1, "Required"),
  compensationPeriod: z.enum(["hourly", "monthly", "annual"]),
});

type FormValues = z.infer<typeof schema>;

export default function ContractNew() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workers } = useListWorkers({}, { query: { queryKey: getListWorkersQueryKey() } });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contractType: "full_time",
      currency: "USD",
      compensationPeriod: "annual",
    },
  });

  const createContract = useCreateContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
        toast({ title: "Contract created" });
        navigate("/contracts");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create contract", variant: "destructive" });
      },
    }
  });

  const onSubmit = (values: FormValues) => {
    createContract.mutate({
      data: {
        workerId: parseInt(values.workerId),
        organizationId: 1,
        title: values.title,
        contractType: values.contractType,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        currency: values.currency,
        compensation: parseFloat(values.compensation),
        compensationPeriod: values.compensationPeriod,
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" className="rounded-none -ml-2 text-muted-foreground" data-testid="button-back">
        <Link href="/contracts"><ArrowLeft className="size-4 mr-2" />Back to Contracts</Link>
      </Button>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>New Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="workerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Worker</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-none" data-testid="select-worker">
                        <SelectValue placeholder="Select worker..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-none">
                      {workers?.map(w => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.firstName} {w.lastName} — {w.jobTitle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Title</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Senior Engineer - Full-time" className="rounded-none" data-testid="input-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contractType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-none" data-testid="select-contract-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none">
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="fixed_term">Fixed Term</SelectItem>
                        <SelectItem value="indefinite">Indefinite</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="compensationPeriod" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compensation Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-none" data-testid="select-compensation-period">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none">
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="compensation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compensation Amount</FormLabel>
                    <FormControl><Input {...field} type="number" className="rounded-none" data-testid="input-compensation" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl><Input {...field} placeholder="USD, EUR..." className="rounded-none" data-testid="input-currency" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input {...field} type="date" className="rounded-none" data-testid="input-start-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (optional)</FormLabel>
                    <FormControl><Input {...field} type="date" className="rounded-none" data-testid="input-end-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-none" disabled={createContract.isPending} data-testid="button-submit">
                  {createContract.isPending ? "Creating..." : "Create Contract"}
                </Button>
                <Button type="button" variant="outline" className="rounded-none" asChild>
                  <Link href="/contracts">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
