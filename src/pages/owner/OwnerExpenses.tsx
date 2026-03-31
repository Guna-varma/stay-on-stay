import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { 
  listExpenseCategories,
  createExpenseCategory,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  type ExpenseCategory,
  type Expense,
  type ExpenseByCategory 
} from "@/lib/supabase";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ExpensesTabProps {
  hotelId: string;
}

const CATEGORY_COLORS = [
  "hsl(174, 100%, 24%)",
  "hsl(142, 76%, 36%)",
  "hsl(24, 100%, 50%)",
  "hsl(210, 100%, 56%)",
  "hsl(280, 100%, 50%)",
  "hsl(45, 100%, 50%)",
  "hsl(0, 100%, 50%)",
];

export default function OwnerExpenses({ hotelId }: ExpensesTabProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<ExpenseByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  // New category
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (hotelId) {
      loadExpenses();
    } else {
      setLoading(false);
    }
  }, [hotelId]);

  const loadCategories = async () => {
    const { data, error } = await listExpenseCategories();
    if (!error && data) setCategories(data);
  };

  const loadExpenses = async () => {
    if (!hotelId) return;
    setLoading(true);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [expensesRes, breakdownRes] = await Promise.all([
      listExpenses(
        hotelId,
        startOfMonth.toISOString().split("T")[0],
        endOfMonth.toISOString().split("T")[0]
      ),
      getExpensesByCategory(
        hotelId,
        startOfMonth.toISOString().split("T")[0],
        endOfMonth.toISOString().split("T")[0]
      ),
    ]);

    if (!expensesRes.error) setExpenses(expensesRes.data);
    if (!breakdownRes.error) setCategoryBreakdown(breakdownRes.data);
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user?.id) return;
    setAddingCategory(true);
    const { data, error } = await createExpenseCategory(newCategoryName.trim(), null, user.id);
    setAddingCategory(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setCategories((prev) => [...prev, data]);
      setNewCategoryName("");
      toast.success("Category added!");
    }
  };

  const openAddDialog = () => {
    setEditingExpense(null);
    setFormCategoryId("");
    setFormAmount("");
    setFormDescription("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setFormCategoryId(expense.category_id);
    setFormAmount(expense.amount.toString());
    setFormDescription(expense.description || "");
    setFormDate(expense.expense_date);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!hotelId || !user?.id) return;
    if (!formCategoryId.trim()) {
      toast.error("Please select a category");
      return;
    }
    const amount = Number(formAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    let result;
    if (editingExpense) {
      result = await updateExpense(editingExpense.id, {
        category_id: formCategoryId,
        amount,
        description: formDescription.trim() || null,
        expense_date: formDate,
      });
    } else {
      result = await createExpense(
        hotelId,
        formCategoryId,
        amount,
        formDescription.trim() || null,
        formDate,
        user.id
      );
    }
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success(editingExpense ? "Expense updated!" : "Expense added!");
    setDialogOpen(false);
    await loadExpenses();
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    setDeleting(expenseId);
    const { error } = await deleteExpense(expenseId);
    setDeleting(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Expense deleted");
    await loadExpenses();
  };

  const totalExpenses = categoryBreakdown.reduce((s, c) => s + c.total_amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hotelId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Please select a hotel to manage expenses.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expense Management</h2>
          <p className="text-sm text-muted-foreground">Current month</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingExpense ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Expense Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100 text-red-700">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses (This Month)</p>
                <p className="text-3xl font-heading font-bold">₹{totalExpenses.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No expenses recorded this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="total_amount"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category_name}: ₹${entry.total_amount.toFixed(0)}`}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₹${value.toFixed(0)}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
                ) : (
                  categoryBreakdown.map((cat, idx) => (
                    <div key={cat.category_id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium text-sm">{cat.category_name}</p>
                          <p className="text-xs text-muted-foreground">{cat.expense_count} expense{cat.expense_count > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <p className="font-semibold">₹{cat.total_amount.toFixed(0)}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Category */}
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs">Add Custom Category</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategoryName.trim()}
                  >
                    {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Expenses (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No expenses recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Category</th>
                      <th className="text-left p-2 font-medium">Description</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                      <th className="text-right p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2">{new Date(exp.expense_date).toLocaleDateString()}</td>
                        <td className="p-2">
                          <Badge variant="outline">{exp.category_name}</Badge>
                        </td>
                        <td className="p-2 text-muted-foreground max-w-xs truncate">
                          {exp.description || "—"}
                        </td>
                        <td className="p-2 text-right font-medium">₹{exp.amount.toFixed(0)}</td>
                        <td className="p-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(exp)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleting === exp.id}
                              onClick={() => handleDelete(exp.id)}
                            >
                              {deleting === exp.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
