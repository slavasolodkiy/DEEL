import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateWorker, getListWorkersQueryKey } from "@workspace/api-client-react";
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
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  jobTitle: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  workerType: z.enum(["employee", "contractor", "eor"]),
  country: z.string().min(2, "Required"),
  currency: z.string().min(3, "Required"),
  salary: z.string().optional(),
  startDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function WorkerNew() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      workerType: "employee",
      currency: "USD",
    },
  });

  const createWorker = useCreateWorker({
    mutation: {
      onSuccess: (worker) => {
        queryClient.invalidateQueries({ queryKey: getListWorkersQueryKey() });
        toast({ title: "Worker added", description: `${worker.firstName} ${worker.lastName} has been added` });
        navigate(`/workers/${worker.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create worker", variant: "destructive" });
      },
    }
  });

  const onSubmit = (values: FormValues) => {
    createWorker.mutate({
      data: {
        organizationId: 1,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        jobTitle: values.jobTitle,
        department: values.department,
        workerType: values.workerType,
        country: values.country,
        currency: values.currency,
        salary: values.salary ? parseFloat(values.salary) : undefined,
        startDate: values.startDate || undefined,
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" className="rounded-none -ml-2 text-muted-foreground" data-testid="button-back">
        <Link href="/workers"><ArrowLeft className="size-4 mr-2" />Back to Workers</Link>
      </Button>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Add New Worker</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} className="rounded-none" data-testid="input-first-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} className="rounded-none" data-testid="input-last-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} type="email" className="rounded-none" data-testid="input-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="jobTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl><Input {...field} className="rounded-none" data-testid="input-job-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl><Input {...field} className="rounded-none" data-testid="input-department" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="workerType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worker Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-none" data-testid="select-worker-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none">
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="eor">EOR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country (ISO)</FormLabel>
                    <FormControl><Input {...field} placeholder="US, GB, DE..." className="rounded-none" data-testid="input-country" /></FormControl>
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
                <FormField control={form.control} name="salary" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Salary (optional)</FormLabel>
                    <FormControl><Input {...field} type="number" className="rounded-none" data-testid="input-salary" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date (optional)</FormLabel>
                    <FormControl><Input {...field} type="date" className="rounded-none" data-testid="input-start-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-none" disabled={createWorker.isPending} data-testid="button-submit">
                  {createWorker.isPending ? "Adding..." : "Add Worker"}
                </Button>
                <Button type="button" variant="outline" className="rounded-none" asChild>
                  <Link href="/workers">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
