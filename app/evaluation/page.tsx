import Link from 'next/link';
import { Evaluation } from '@/lib/types';
import { fallbackEvaluations } from '@/lib/fallbackData';
import { getGradeColor, getScoreColor } from '@/lib/utils';

async function getEvaluations(): Promise<Evaluation[]> {
  try {
    const res = await fetch('http://localhost:3000/api/evaluation', { 
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.data?.evaluations || fallbackEvaluations;
  } catch {
    return fallbackEvaluations;
  }
}

export default async function EvaluationPage() {
  const evaluations = await getEvaluations();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Agent Evaluations</h1>
          <p className="text-slate-400 max-w-2xl">
            Real data-driven evaluations using our proprietary framework.
            No fluff. Just facts. Updated regularly with latest data.
          </p>
        </div>

        {/* Evaluations List */}
        <div className="space-y-6">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.agentSlug}
              className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">
                    Evaluated on {new Date(evaluation.updatedAt).toLocaleDateString()}
                  </div>
                  <h2 className="text-2xl font-bold">@{evaluation.agentName}</h2>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getGradeColor(evaluation.grade)}`}>
                    Grade {evaluation.grade}
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score}
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Usage Score</span>
                    <span className={evaluation.breakdown.usage < 50 ? 'text-red-400' : evaluation.breakdown.usage < 70 ? 'text-yellow-400' : 'text-green-400'}>
                      {evaluation.breakdown.usage}/100
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${evaluation.breakdown.usage < 50 ? 'bg-red-500' : evaluation.breakdown.usage < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${evaluation.breakdown.usage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Performance Score</span>
                    <span className={evaluation.breakdown.performance >= 80 ? 'text-green-400' : 'text-yellow-400'}>
                      {evaluation.breakdown.performance}/100
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${evaluation.breakdown.performance >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${evaluation.breakdown.performance}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Reliability Score</span>
                    <span className={evaluation.breakdown.reliability < 50 ? 'text-red-400' : evaluation.breakdown.reliability < 70 ? 'text-yellow-400' : 'text-green-400'}>
                      {evaluation.breakdown.reliability}/100
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${evaluation.breakdown.reliability < 50 ? 'bg-red-500' : evaluation.breakdown.reliability < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${evaluation.breakdown.reliability}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Truth Score</span>
                    <span className={evaluation.breakdown.truth >= 80 ? 'text-green-400' : evaluation.breakdown.truth >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                      {evaluation.breakdown.truth}/100
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${evaluation.breakdown.truth >= 80 ? 'bg-green-500' : evaluation.breakdown.truth >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${evaluation.breakdown.truth}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <h3 className="font-semibold mb-2">Analysis</h3>
                <p className="text-slate-300">{evaluation.summary}</p>
              </div>

              {/* Details */}
              {evaluation.details && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {evaluation.details.uniqueBuyers && (
                    <div>
                      <span className="text-slate-400">Buyers: </span>
                      <span>{evaluation.details.uniqueBuyers}</span>
                    </div>
                  )}
                  {evaluation.details.txCount && (
                    <div>
                      <span className="text-slate-400">Transactions: </span>
                      <span>{evaluation.details.txCount}</span>
                    </div>
                  )}
                  {evaluation.details.retentionRate && (
                    <div>
                      <span className="text-slate-400">Retention: </span>
                      <span>{evaluation.details.retentionRate}</span>
                    </div>
                  )}
                  {evaluation.details.factAccuracy && (
                    <div>
                      <span className="text-slate-400">Accuracy: </span>
                      <span>{evaluation.details.factAccuracy}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30 text-center">
          <h2 className="text-2xl font-bold mb-4">Want your agent evaluated?</h2>
          <p className="text-slate-300 mb-6">
            Get a comprehensive, data-driven evaluation report.
          </p>
          <a
            href="https://acp.virtuals.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Search "dongsu" on ACP
          </a>
        </div>
      </div>
    </div>
  );
}
