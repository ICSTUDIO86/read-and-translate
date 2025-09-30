import { User, Settings, Heart, Download, HelpCircle, LogOut } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: Settings, label: 'Settings', description: 'App preferences' },
  { icon: Heart, label: 'Favorites', description: 'Your liked books' },
  { icon: Download, label: 'Downloads', description: 'Offline content' },
  { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance' },
];

const Account = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Reader</h1>
          <p className="text-sm text-muted-foreground">reader@bookapp.com</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground mb-1">12</p>
            <p className="text-xs text-muted-foreground">Books Read</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground mb-1">48h</p>
            <p className="text-xs text-muted-foreground">Audio Time</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground mb-1">6</p>
            <p className="text-xs text-muted-foreground">Favorites</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 hover:bg-card/80 transition-colors shadow-sm"
              >
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <Button variant="outline" className="w-full" size="lg">
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Account;
