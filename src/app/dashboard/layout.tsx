import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { DemoWatermark } from '@/components/demo/demo-watermark';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Utilisateur par défaut - pas d'auth obligatoire
  const user = {
    id: 'user-standalone',
    email: 'user@socialguard.app',
    full_name: 'Utilisateur SocialGuard',
    company_name: 'Mon Entreprise',
    role: 'admin',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Watermark mode démo */}
      <DemoWatermark />
      
      <div className="flex h-screen" style={{ paddingTop: '80px' }}>
        {/* Sidebar Navigation */}
        <div className="hidden md:flex md:flex-shrink-0">
          <DashboardSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardHeader user={user} />
          
          {/* Page Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
