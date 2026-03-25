"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, XCircle, ArrowLeft, Filter } from "lucide-react";
import Link from "next/link";

export default function ReviewClient({ attempt, questions, answers, reactions }: any) {
  const [filter, setFilter] = useState<string>("All");

  const dimensions = Array.from(new Set(questions.map((q: any) => q.dimension)));

  const filteredQuestions = filter === "All" 
    ? questions 
    : questions.filter((q: any) => q.dimension === filter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Assessment Review
          </h1>
          <p className="text-gray-400 mt-2">
            Review your answers, see correct responses, and read explanations.
          </p>
        </div>
        <Link href={`/results/${attempt.attemptId}`}>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
        </Link>
      </div>

      {/* Filter Bar */}
      <GlassPanel className="p-4 flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-400 mr-2" />
        <button
          onClick={() => setFilter("All")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === "All" ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}
        >
          All Dimensions
        </button>
        {dimensions.map((dim: any) => (
          <button
            key={dim}
            onClick={() => setFilter(dim)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === dim ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}
          >
            {dim}
          </button>
        ))}
      </GlassPanel>

      {/* Review List */}
      <div className="space-y-6">
        {filteredQuestions.map((question: any, index: number) => {
          const userAnswerData = answers[question.id];
          const isCorrect = userAnswerData?.correct;
          const userOption = question.options.find((opt: any) => opt.id === userAnswerData?.answerId);
          const correctOption = question.options.find((opt: any) => opt.score === 1);
          const userReaction = reactions.find((r: any) => r.questionId === question.id);

          return (
            <GlassPanel key={question.id} className={`p-6 border-l-4 ${isCorrect ? "border-l-emerald-500" : "border-l-rose-500"}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Badge color="info" className="border-primary/30 text-primary">
                    Q{index + 1}
                  </Badge>
                  <Badge color="info" className="text-gray-400">
                    {question.dimension}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                   {isCorrect ? (
                     <Badge color="success" className="flex items-center gap-1.5 px-3 py-1">
                       <CheckCircle2 className="w-4 h-4" /> Correct
                     </Badge>
                   ) : (
                     <Badge color="warning" className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border-rose-500/30">
                       <XCircle className="w-4 h-4" /> Incorrect
                     </Badge>
                   )}
                </div>
              </div>

              <h3 className="text-xl font-medium text-white/90 mb-6">{question.scenario}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* User's Answer */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Your Answer</h4>
                  <div className={`p-4 rounded-xl border ${isCorrect ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200" : "border-rose-500/30 bg-rose-500/5 text-rose-200"}`}>
                    {userOption ? userOption.text : <span className="italic text-gray-500">No answer provided</span>}
                  </div>
                </div>

                {/* Correct Answer (if user got it wrong) */}
                {!isCorrect && alignCorrectAnswer(correctOption)}
              </div>

              {/* Rationale & Feedback */}
              <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                <div>
                   <h4 className="text-sm font-medium text-primary mb-2">Rationale</h4>
                   <p className="text-gray-300">{question.rationale}</p>
                </div>
                
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                   <h4 className="text-sm font-medium text-primary mb-1">Guiding Principle</h4>
                   <p className="text-primary/70 text-sm">{question.competency}</p>
                </div>
              </div>
              
              {userReaction && (
                 <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                   <span className="font-medium text-white/60">Your feedback on this question:</span> 
                   {userReaction.vote === "up" ? "👍 Helpful" : "👎 Confusing/Incorrect"}
                   {userReaction.comment && <span className="italic">"{userReaction.comment}"</span>}
                 </div>
              )}
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

function alignCorrectAnswer(correctOption: any) {
  if (!correctOption) return null;
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Correct Answer</h4>
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-200">
        {correctOption.text}
      </div>
    </div>
  );
}
