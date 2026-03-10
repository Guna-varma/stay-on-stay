import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { User, UserCheck, Users, Sparkles, Truck, DollarSign, Building, Settings, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";

interface RoleCard {
  role: UserRole;
  label: string;
  email: string;
  icon: any;
  color: string;
}

const ROLE_CARDS: RoleCard[] = [
  { role: "customer", label: "Customer", email: "customer@stayonstay.com", icon: User, color: "bg-info/10 text-info" },
  { role: "receptionist", label: "Receptionist", email: "reception@stayonstay.com", icon: UserCheck, color: "bg-primary/10 text-primary" },
  { role: "senior_receptionist", label: "Senior Receptionist", email: "senior.reception@stayonstay.com", icon: Users, color: "bg-primary/15 text-primary" },
  { role: "housekeeping", label: "Housekeeping", email: "housekeeping@stayonstay.com", icon: Sparkles, color: "bg-success/10 text-success" },
  { role: "transport", label: "Transport Manager", email: "transport@stayonstay.com", icon: Truck, color: "bg-warning/10 text-warning" },
  { role: "finance", label: "Finance Manager", email: "finance@stayonstay.com", icon: DollarSign, color: "bg-success/10 text-success" },
  { role: "owner", label: "Hotel Owner", email: "owner@stayonstay.com", icon: Building, color: "bg-info/10 text-info" },
  { role: "admin", label: "Platform Admin", email: "admin@stayonstay.com", icon: Settings, color: "bg-destructive/10 text-destructive" },
];

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleCard | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSelectRole = (card: RoleCard) => {
    setSelectedRole(card);
    setEmail(card.email);
    setPassword("12345678");
  };

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.success) {
        toast({ title: "Login successful", description: "Welcome back!" });
        navigate("/dashboard");
      } else {
        toast({ variant: "destructive", title: "Login failed", description: result.error });
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <BrandLogo variant="login" className="h-10 w-[170px] sm:h-12 sm:w-[210px] shadow-card" />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
        {!selectedRole ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl"
          >
            <div className="text-center mb-8">
              <div className="mb-5 flex justify-center">
                <BrandLogo variant="login" className="shadow-elevated" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold">Sign in to StayOnStay</h1>
              <p className="text-muted-foreground mt-2">Select your role to continue</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROLE_CARDS.map((card, i) => (
                <motion.div
                  key={card.role}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-elevated hover:border-primary/30 transition-all group"
                    onClick={() => handleSelectRole(card)}
                  >
                    <CardContent className="p-5 text-center">
                      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${card.color} transition-transform group-hover:scale-110`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-heading font-semibold text-sm mb-1">{card.label}</h3>
                      <p className="text-[10px] text-muted-foreground truncate">{card.email}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              Password for all accounts: <Badge variant="secondary" className="text-[10px] font-mono">12345678</Badge>
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            <Card className="shadow-elevated">
              <CardHeader className="text-center pb-4">
                <div className="mb-4 flex justify-center">
                  <BrandLogo variant="login" className="h-11 w-[190px] shadow-card" />
                </div>
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl ${selectedRole.color}`}>
                  <selectedRole.icon className="h-7 w-7" />
                </div>
                <CardTitle className="text-lg font-heading">{selectedRole.label} Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleLogin} disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <Button variant="ghost" className="w-full text-xs" onClick={() => setSelectedRole(null)}>
                  ← Choose different role
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
