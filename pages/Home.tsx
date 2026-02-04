
import React from 'react';

interface HomeProps {
  onOpenChat: () => void;
  onOpenVoice: () => void;
}

const Home: React.FC<HomeProps> = ({ onOpenChat, onOpenVoice }) => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/hvac/1920/1080" 
            alt="HVAC background" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
              Comfort Managed by <span className="text-blue-400">Intelligence.</span>
            </h1>
            <p className="text-lg leading-8 text-slate-300 mb-10">
              Premium HVAC installation and maintenance services for homes and businesses. 
              Powered by AI booking and top-tier Australian expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onOpenVoice}
                className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
              >
                Call to Book Now
              </button>
              <button 
                onClick={onOpenChat}
                className="inline-flex items-center justify-center bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all"
              >
                Chat/Book Online
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">Our Core Services</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Whether it's a scorching summer or a freezing winter, our experts ensure your climate control is flawless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard 
              title="New Installation"
              description="Modern energy-efficient units tailored to your space requirements."
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />}
            />
            <ServiceCard 
              title="Repair & Maintenance"
              description="Quick diagnostics and lasting repairs for all major HVAC brands."
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
            />
            <ServiceCard 
              title="Ducted Systems"
              description="Whole-home comfort with seamless integration and smart zoning."
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            />
            <ServiceCard 
              title="Emergency Service"
              description="Available 24/7 for critical HVAC failures and breakdowns."
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              highlight
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img 
                src="https://picsum.photos/seed/hvac-tech/800/600" 
                alt="HVAC technician" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Reliable Service Across Canberra & Beyond</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                ArcticFlow AI HVAC is built on decades of mechanical engineering excellence combined with cutting-edge AI dispatching technology. 
                We pride ourselves on local knowledge, punctuality, and transparent pricing.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-slate-700">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">✓</span>
                  Licensed and Insured Professionals
                </li>
                <li className="flex items-center text-slate-700">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">✓</span>
                  All Work Fully Guaranteed
                </li>
                <li className="flex items-center text-slate-700">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">✓</span>
                  24/7 Priority Support for Members
                </li>
              </ul>
              <button className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4">Learn more about our team →</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ServiceCard: React.FC<{ title: string; description: string; icon: React.ReactNode; highlight?: boolean }> = ({ title, description, icon, highlight }) => (
  <div className={`p-8 rounded-2xl border ${highlight ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200' : 'bg-white text-slate-900 border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300'}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${highlight ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className={`text-sm leading-relaxed ${highlight ? 'text-blue-100' : 'text-slate-600'}`}>
      {description}
    </p>
    <button className={`mt-6 text-sm font-bold ${highlight ? 'text-white border-b-2 border-white/30 hover:border-white' : 'text-blue-600 border-b-2 border-blue-100 hover:border-blue-600'} transition-all`}>
      Book This Service
    </button>
  </div>
);

export default Home;
