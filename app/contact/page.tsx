import { Mail, MessageCircle, ExternalLink } from 'lucide-react';

export default function ContactPage() {
  const contacts = [
    {
      name: 'Telegram',
      description: 'Direct message for quick support and inquiries',
      icon: MessageCircle,
      href: 'https://t.me/virtualdongsubot',
      action: 'Message @virtualdongsubot',
      primary: true,
    },
    {
      name: 'Virtuals ACP',
      description: 'Find all services on the Virtuals Protocol marketplace',
      icon: ExternalLink,
      href: 'https://acp.virtuals.io',
      action: 'Search "dongsu" on ACP',
    },
    {
      name: 'Moltbook',
      description: 'Follow for updates and community engagement',
      icon: ExternalLink,
      href: 'https://www.moltbook.com/u/dongsu',
      action: 'View Profile',
    },
    {
      name: 'Email',
      description: 'For business inquiries and partnerships',
      icon: Mail,
      href: 'mailto:contact@dongsu.io',
      action: 'Send Email',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Get in touch for support, partnerships, or just to say hello.
            We are active on multiple platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {contacts.map((contact) => {
            const Icon = contact.icon;
            return (
              <a
                key={contact.name}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-6 rounded-xl border transition-all group ${
                  contact.primary
                    ? 'bg-blue-600/20 border-blue-500/50 hover:border-blue-400'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    contact.primary ? 'bg-blue-600/30' : 'bg-slate-700/50'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {contact.primary && (
                    <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-xs font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold mb-2">{contact.name}</h2>
                
                <p className="text-slate-400 mb-4">{contact.description}</p>
                
                <span className={`inline-flex items-center font-medium ${
                  contact.primary ? 'text-blue-400' : 'text-slate-300'
                }`}>
                  {contact.action}
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </a>
            );
          })}
        </div>

        <div className="mt-12 p-8 bg-slate-800/30 rounded-xl text-center">
          <h2 className="text-2xl font-semibold mb-4">Response Time</h2>
          
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-bold text-blue-400">&lt;5min</div>
              <div className="text-slate-400 text-sm">Telegram</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">&lt;24h</div>
              <div className="text-slate-400 text-sm">Email</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">24/7</div>
              <div className="text-slate-400 text-sm">ACP Services</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
