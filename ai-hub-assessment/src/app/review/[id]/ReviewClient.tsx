"use client";

import { useState } from "react";
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
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">
            Assessment Review
          </h1>
          <p className="text-muted-foreground mt-2">
            Review your answers, see correct responses, and read explanations.
          </p>
        </div>
        <Link href={`/results/${attempt.attemptId}`}>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-[#ff4e00]/30 transition-all text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="border border-border p-4 flex flex-wrap gap-2 items-center bg-card">
        <Filter className="w-4 h-4 text-muted-foreground mr-2" />
        <button
          onClick={() => setFilter("All")}
          className={`px-4 py-1.5 text-sm font-medium transition-all ${filter === "All" ? "bg-[#ff4e00]/10 text-[#ff4e00] border border-[#ff4e00]/30" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"}`}
        >
          All Dimensions
        </button>
        {dimensions.map((dim: any) => (
          <button
            key={dim}
            onClick={() => setFilter(dim)}
            className={`px-4 py-1.5 text-sm font-medium transition-all ${filter === dim ? "bg-[#ff4e00]/10 text-[#ff4e00] border border-[#ff4e00]/30" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"}`}
          >
            {dim}
          </button>
        ))}
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {filteredQuestions.map((question: any, index: number) => {
          const userAnswerData = answers[question.id];
          const isCorrect = userAnswerData?.correct;
          const userOption = question.options.find((opt: any) => opt.id === userAnswerData?.answerId);
          const correctOption = question.options.find((opt: any) => opt.score === 1);
          const userReaction = reactions.find((r: any) => r.questionId === question.id);

          return (
            <div key={question.id} className={`border border-border p-6 border-l-4 bg-card ${isCorrect ? "border-l-emerald-500" : "border-l-rose-500"}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Badge color="info" className="border-[#ff4e00]/30 text-[#ff4e00]">
                    Q{index + 1}
                  </Badge>
                  <Badge color="info" className="text-muted-foreground">
                    {question.dimension}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                   {isCorrect ? (
                     <Badge color="success" className="flex items-center gap-1.5 px-3 py-1">
                       <CheckCircle2 className="w-4 h-4" /> Correct
                     </Badge>
                   ) : (
                     <Badge color="warning" className="flex items-center gap-1.5 px-3 py-1 bg-muted text-foreground border-border">
                       <XCircle className="w-4 h-4" /> Incorrect
                     </Badge>
                   )}
                </div>
              </div>

              <h3 className="text-xl font-medium mb-6">{question.scenario}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* User's Answer */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground tracking-wider">Your Answer</h4>
                  <div className={`p-4 border ${isCorrect ? "border-border bg-muted/50 border-l-2 border-l-[#ff4e00] text-foreground" : "border-border bg-muted/50 border-l-2 border-l-border text-foreground"}`}>
                    {userOption ? userOption.text : <span className="italic text-muted-foreground">No answer provided</span>}
                  </div>
                </div>

                {/* Correct Answer (if user got it wrong) */}
                {!isCorrect && alignCorrectAnswer(correctOption)}
              </div>

              {/* Rationale & Feedback */}
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div>
                   <h4 className="text-sm font-medium text-[#ff4e00] mb-2">Rationale</h4>
                   <p className="text-muted-foreground">{question.rationale}</p>
                </div>
                
                <div className="p-4 bg-[#ff4e00]/5 border border-[#ff4e00]/15">
                   <h4 className="text-sm font-medium text-[#ff4e00] mb-1">Guiding Principle</h4>
                   <p className="text-muted-foreground text-sm">{question.competency}</p>
                </div>
              </div>
              
              {userReaction && (
                 <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                   <span className="font-medium text-foreground/60">Your feedback on this question:</span> 
                   {userReaction.vote === "up" ? "👍 Helpful" : "👎 Confusing/Incorrect"}
                   {userReaction.comment && <span className="italic">"{userReaction.comment}"</span>}
                 </div>
              )}
            </div>
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
      <h4 className="text-sm font-medium text-muted-foreground tracking-wider">Correct Answer</h4>
      <div className="p-4 border border-border bg-muted/50 border-l-2 border-l-[#ff4e00] text-foreground">
        {correctOption.text}
      </div>
    </div>
  );
}
