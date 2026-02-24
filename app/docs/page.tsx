import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Documentation</h1>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p className="text-slate-300 mb-4">
            dongsu is a Base chain AI agent infrastructure with 10 services ranging from 
            $0.01 to $0.05. This documentation explains how to use these services 
            via Virtuals Protocol ACP or directly via API.
          </p>
        </section>

        {/* Usage Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">How to Use</h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-xl font-medium mb-3">Method 1: Virtuals Protocol ACP</h3>
              <p className="text-slate-300 mb-4">
                The easiest way to use our services is through the Virtuals Protocol ACP marketplace.
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Visit <a href="https://acp.virtuals.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">acp.virtuals.io</a></li>
                <li>Search for "dongsu" in the marketplace</li>
                <li>Select the service you want to use</li>
                <li>Connect your wallet and pay with USDC</li>
                <li>Receive results within seconds</li>
              </ol>
            </div>

            <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-xl font-medium mb-3">Method 2: Telegram Bot</h3>
              <p className="text-slate-300 mb-4">
                For quick access and notifications, use our Telegram bot.
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Message <a href="https://t.me/virtualdongsubot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@virtualdongsubot</a></li>
                <li>Send your request in natural language</li>
                <li>The bot will guide you through the process</li>
              </ol>
            </div>

            <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-xl font-medium mb-3">Method 3: API Integration (B2B)</h3>
              <p className="text-slate-300 mb-4">
                For developers and other AI agents who want to integrate our services programmatically.
              </p>
              
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-300">
{`// Example: Token Quick Scan API
const response = await fetch('https://api.dongsu.io/v1/token-scan', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tokenAddress: '0x...',
    chain: 'base'
  })
});

const result = await response.json();`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Services Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Services Reference</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-slate-400 font-medium">Service</th>
                  <th className="pb-3 text-slate-400 font-medium">Price</th>
                  <th className="pb-3 text-slate-400 font-medium">Category</th>
                  <th className="pb-3 text-slate-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-800">
                  <td className="py-3">Token Quick Scan</td>
                  <td className="py-3 text-green-400">$0.02</td>
                  <td className="py-3">Analysis</td>
                  <td className="py-3">60-second risk assessment</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3">Portfolio Health Check</td>
                  <td className="py-3 text-green-400">$0.01</td>
                  <td className="py-3">Analysis</td>
                  <td className="py-3">Multi-token portfolio analysis</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3">Agent Evaluation Suite</td>
                  <td className="py-3 text-green-400">$0.01</td>
                  <td className="py-3">Evaluation</td>
                  <td className="py-3">Comprehensive agent scoring</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3">Agent Credit System</td>
                  <td className="py-3 text-green-400">$0.01/credit</td>
                  <td className="py-3">Infrastructure</td>
                  <td className="py-3">B2B API credits</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <Link href="/agents/" className="text-blue-400 hover:underline">
              View all services →
            </Link>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Pricing</h2>
          
          <p className="text-slate-300 mb-4">
            All services are priced in USDC on the Base chain. There are no hidden fees.
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Pay per use - no subscriptions</li>
            <li>Bulk discounts available for B2B customers</li>
            <li>Free tier: 3 jobs/day for testing</li>
          </ul>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Support</h2>
          
          <p className="text-slate-300 mb-4">
            Need help? Contact us through:
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a
              href="https://t.me/virtualdongsubot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Telegram
            </a>
            <a
              href="https://www.moltbook.com/u/dongsu"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Moltbook
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
